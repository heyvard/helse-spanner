package no.nav.spanner

import FeilRespons
import com.fasterxml.jackson.module.kotlin.readValue
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.features.json.*
import io.ktor.features.*
import io.ktor.http.*
import io.ktor.jackson.*
import io.ktor.request.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.sessions.*
import io.ktor.util.pipeline.*
import no.nav.spanner.AuditLogger.Companion.audit
import no.nav.spanner.Log.Companion.LogLevel
import no.nav.spanner.Log.Companion.LogLevel.ERROR
import no.nav.spanner.Log.Companion.LogLevel.INFO
import org.slf4j.LoggerFactory
import org.slf4j.event.Level
import java.time.LocalDateTime
import java.util.*

enum class IdType(val header: String) {
    FNR("fnr"), AKTORID("aktorId")
}

enum class EnvType {
    LOCAL, PROD;

    companion object {
        fun fromString(env: String) = when (env) {
            "prod" -> PROD
            "local" -> LOCAL
            else -> throw IllegalArgumentException("Illegal environment - env: $env")
        }
    }
}

val logg = Log.logger("Application")

fun Application.mainModule() {
    val config = AzureADConfig.fromEnv()
    val azureAD = AzureAD(config)
    val env = EnvType.fromString(this.environment.config.property("ktor.environment").getString())
    logg
        .åpent("applicationEnvironment", env)
        .info("Spanner startet")
    val spleis = if (env == EnvType.LOCAL) LokaleKjenninger else Spleis.fromEnv(azureAD)
    return configuredModule(spleis, config, env)
}

fun Application.configuredModule(spleis: Personer, config: AzureADConfig, env: EnvType) {
    install(CallId) {
        generate {
            UUID.randomUUID().toString()
        }
    }
    install(CallLogging) {
        level = Level.INFO
        filter { call -> !call.request.path().startsWith("/internal") }
    }
    install(XForwardedHeaderSupport)

    install(StatusPages) {
        suspend fun respondToException(
            status: HttpStatusCode,
            call: ApplicationCall,
            cause: Throwable,
            level: LogLevel
        ) {
            val errorId = UUID.randomUUID()
            logg
                .åpent("errorId", errorId)
                .åpent("status", status)
                .call(call)
                .exception(cause)
                .log(level)
            call.respond(status, FeilRespons(errorId.toString(), cause.message))
        }
        exception<NotFoundException> { cause ->
            respondToException(HttpStatusCode.NotFound, call, cause, INFO)
        }
        exception<BadRequestException> { cause ->
            respondToException(HttpStatusCode.BadRequest, call, cause, INFO)
        }
        exception<InvalidSession> { cause ->
            call.sessions.clear<SpannerSession>()
            respondToException(HttpStatusCode.Unauthorized, call, cause, INFO)
        }
        exception<Throwable> { cause ->
            respondToException(HttpStatusCode.InternalServerError, call, cause, ERROR)
        }
    }

    install(ContentNegotiation) { register(ContentType.Application.Json, JacksonConverter(objectMapper)) }
    install(Sessions) {
        cookie<SpannerSession>("spanner", storage = SessionStorageMemory()) {
            this.cookie.secure = env != EnvType.LOCAL
            cookie.extensions["SameSite"] = if (env != EnvType.LOCAL) "strict" else "lax"
            serializer = object: SessionSerializer<SpannerSession> {
                override fun deserialize(text: String): SpannerSession = objectMapper.readValue(text)
                override fun serialize(session: SpannerSession) = objectMapper.writeValueAsString(session)
            }
        }
    }

    val httpClient = HttpClient(CIO) {
        install(JsonFeature) {
            serializer = JacksonSerializer()
        }
    }

    install(Authentication) {
        oauth("oauth") {
            urlProvider = { redirectUrl("/oauth2/callback", env) }
            skipWhen { call -> call.sessions.get<SpannerSession>() != null }

            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "AAD",
                    authorizeUrl = config.authorizationEndpoint,
                    accessTokenUrl = config.tokenEndpoint,
                    requestMethod = HttpMethod.Post,
                    clientId = config.clientId,
                    clientSecret = config.clientSecret,
                    defaultScopes = listOf("openid", "${config.clientId}/.default")
                )
            }
            client = httpClient
        }
    }

    naisApi()

    routing {
        authenticate("oauth") {
            frontendRouting()
            oidc()
            get("/api/person/") {
                checkIfsessionValid()
                try {
                    sesjon().audit().log(call)
                    val (idType, idValue) = call.personId()
                    logg
                        .åpent("idType", idType)
                        .sensitivt("idValue", idValue)
                        .call(this.call)
                        .info()
                    if (idValue.isNullOrBlank()) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            "${IdType.AKTORID.header} or ${IdType.FNR.header} must be set"
                        )
                    } else {
                        val accessToken = call.sessions.get<SpannerSession>()?.accessToken.toString()
                        val person = spleis.person(idValue, idType, accessToken)
                        call.respondText(person, ContentType.Application.Json, HttpStatusCode.OK)
                    }

                } catch (err: Exception) {
                    val errorId = UUID.randomUUID()
                    logg
                        .åpent("errorId", errorId)
                        .call(call)
                        .exception(err)
                        .error()
                    call.respond(HttpStatusCode.InternalServerError, "Error id: $errorId")
                }
            }
        }
    }
}

private fun ApplicationCall.personId() =
    request.headers[IdType.FNR.header]?.let {
        Pair(IdType.FNR, request.header(IdType.FNR.header))
    } ?: Pair(IdType.AKTORID, request.header(IdType.AKTORID.header))


private fun ApplicationCall.redirectUrl(path: String, env: EnvType): String {
    val protocol = if (env == EnvType.PROD) "https" else request.origin.scheme
    val defaultPort = if (protocol == "http") 80 else 443
    val hostPort = request.host() + request.port().let { port ->
        if (port == defaultPort || env == EnvType.PROD) "" else ":$port"
    }
    return "$protocol://$hostPort$path"
}

private fun PipelineContext<Unit, ApplicationCall>.checkIfsessionValid() {
    if (sesjon().validBefore < LocalDateTime.now()) {
        throw InvalidSession("access token utgått: validBefore=${sesjon().validBefore} now=${LocalDateTime.now()}")
    }
}

class InvalidSession(message: String): RuntimeException(message)