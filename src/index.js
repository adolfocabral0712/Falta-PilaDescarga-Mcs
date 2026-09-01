export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/datos") {
      return obtenerDatos(env);
    }

    return env.ASSETS.fetch(request);
  }
};


async function obtenerDatos(env) {
  if (!env.JSON_URL || !env.JSON_URL.trim()) {
    return respuestaJSON(
      {
        error: true,
        mensaje: "No está configurado el secreto JSON_URL."
      },
      500
    );
  }

  try {
    const origen = new URL(env.JSON_URL.trim());

    // Evita que Dropbox entregue una copia anterior del archivo.
    origen.searchParams.set("t", Date.now().toString());

    const respuesta = await fetch(origen.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Cloudflare-Worker-Falta-Pila-MCS"
      },
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    });

    if (!respuesta.ok) {
      return respuestaJSON(
        {
          error: true,
          mensaje: "No se pudo consultar el JSON de origen.",
          estadoHTTP: respuesta.status
        },
        502
      );
    }

    const texto = await respuesta.text();

    // Confirma que Dropbox realmente devolvió un JSON válido.
    JSON.parse(texto);

    return new Response(texto, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return respuestaJSON(
      {
        error: true,
        mensaje: "Error interno al consultar la fuente.",
        detalle: error instanceof Error
          ? error.message
          : String(error)
      },
      500
    );
  }
}


function respuestaJSON(contenido, estado = 200) {
  return new Response(
    JSON.stringify(contenido, null, 2),
    {
      status: estado,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}
