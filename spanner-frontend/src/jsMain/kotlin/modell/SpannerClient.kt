package modell

import io.ktor.client.*
import io.ktor.client.features.json.*
import io.ktor.client.features.json.serializer.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.json.JsonObject


class SpannerClient(private val apiPort: Int = 9000) {
    private val client = HttpClient {
        install(JsonFeature) {
            serializer = KotlinxSerializer()
        }
    }

    suspend fun hentPersonMedFnr(fnr: String) = client.request<JsonObject>("/api/person-fnr") {
        port = apiPort
        method = HttpMethod.Get
        contentType(ContentType.Application.Json)
        accept(ContentType.Application.Json)
        header("fnr", fnr)
    }

    suspend fun hentPersonMedAktørId(aktørId: String) = client.request<JsonObject>("/api/person-aktorid") {
        port = apiPort
        method = HttpMethod.Get
        contentType(ContentType.Application.Json)
        accept(ContentType.Application.Json)
        header("aktorId", aktørId)
    }
}