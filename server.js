import express from "express";
import fetch from "node-fetch";

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");
app.use(express.static("public"));

const redirect_uri = "http://localhost:1410/callback";
const client_id = "a00d0ce770ab47678e223d5c4a53d852";
const client_secret = "95b72093c90645ebad5600427e3b77dc";
global.access_token;

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/authorize", (req, res) => {
    var auth_query_parameters = new URLSearchParams({
		response_type: "code",
		client_id: client_id,
		scope: "user-library-read",
		redirect_uri: redirect_uri,
    });

    res.redirect(
        "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
    ); 
});

app.get("/callback", async (req, res) => {
    const code = req.query.code;
    console.log(code);
    var body = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
    })

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "post",
        body: body,
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
            Authorization:
             "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
    });

const data = await response.json();
global.access_token = data.access_token;

res.redirect("/dashboard")
});

async function getData(endpoint) {
    const response = await fetch("https://api.spotify.com/v1" + endpoint, {
        method: "get",
        headers: {
            Authorization: "Bearer " + global.access_token,
        },
    });

    const data = await response.json();
    return data;
}

app.get("/dashboard", async (req, res) => {
    const userInfo = await getData("/me");
    const tracks = await getData("/me/tracks?limit=20");

    res.render("dashboard", { user: userInfo, tracks: tracks.items})
});

app.get("/recommendations", async (req, res) => {
    const params = new URLSearchParams({
        market: "GB",
        seed_genres: "indie",
    })

    const data = await getData('/recommendations?' + params);
    res.render("recommendation", { tracks: data.tracks});
});


let listener = app.listen(1410, function () {
console.log(
 "The app is listening on http://localhost:" + listener.address().port
   );
});