package es.uniovi.prueba;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import io.gatling.javaapi.jdbc.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;
import static io.gatling.javaapi.jdbc.JdbcDsl.*;

public class RegisterUser extends Simulation {

  private HttpProtocolBuilder httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0");
  
  private Map<CharSequence, String> headers_0 = Map.of(
    "Access-Control-Request-Headers", "content-type",
    "Access-Control-Request-Method", "POST",
    "Origin", "http://localhost:3000",
    "Priority", "u=4"
  );
  
  private Map<CharSequence, String> headers_1 = Map.of(
    "Accept", "application/json, text/plain, */*",
    "Content-Type", "application/json",
    "Origin", "http://localhost:3000",
    "Priority", "u=0"
  );
  
  // Feeder para generar datos de usuario únicos usando sintaxis compatible con Java 17
  private List<Map<String, Object>> userFeederData = IntStream.rangeClosed(1, 1000)
    .mapToObj(i -> {
      Map<String, Object> map = new HashMap<>();
      map.put("userId", i);
      map.put("username", "testus" + i);
      map.put("password", "testpa" + i);
      return map;
    })
    .collect(Collectors.toList());

  private ScenarioBuilder scn = scenario("RegisterUser")
    .feed(listFeeder(userFeederData).circular())
    .exec(
      http("Preflight Request - Register")
        .options("/adduser")
        .headers(headers_0)
    )
    .exec(
      http("Register User")
        .post("/adduser")
        .headers(headers_1)
        .body(StringBody(session -> {
          return "{\"username\":\"" + session.getString("username") + 
                 "\",\"password\":\"" + session.getString("password") + "\"}";
        }))
        .check(status().in(200, 201))
        .check(jsonPath("$..message").optional().saveAs("registerMessage"))
    )
    .exec(session -> {
      // Usar forma segura de obtener valores de sesión
      String registerMsg = session.getString("registerMessage");
      if (registerMsg != null) {
        System.out.println("Registration response: " + registerMsg);
      }
      return session;
    })
    .pause(2) // Pequeña pausa entre registro e inicio de sesión
    .exec(
      http("Preflight Request - Login")
        .options("/login")
        .headers(headers_0)
    )
    .exec(
      http("Login User")
        .post("/login")
        .headers(headers_1)
        .body(StringBody(session -> {
          return "{\"username\":\"" + session.getString("username") + 
                 "\",\"password\":\"" + session.getString("password") + "\"}";
        }))
        .check(status().is(200))
        .check(jsonPath("$..token").optional().saveAs("authToken"))
    )
    .exec(session -> {
      String username = session.getString("username");
      String token = session.getString("authToken");
      
      if (token != null) {
        System.out.println("User " + username + " logged in successfully");
      } else {
        System.out.println("Login failed for user " + username);
      }
      return session;
    });

  {
    // Configuración para 1000 usuarios con ramp-up gradual
    setUp(
      scn.injectOpen(
        rampUsers(1000).during(Duration.ofSeconds(60)) // 1000 usuarios en 60 segundos
      )
    ).protocols(httpProtocol)
     .assertions(
       global().responseTime().max().lte(5000),    // Usando lte en lugar de lt
       global().successfulRequests().percent().gte(95.0)  // Usando gte en lugar de gt
     );
  }
}