import express, { json, request } from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser"

const app = express();
app.use(cookieParser())

app.set("views", "./views");
app.set("view engine", "pug");
app.use(express.static("public"));

const redirect_uri = "http://localhost:1410/callback";
const client_id = "XXX";
const client_secret = "XXX";
global.access_token;

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/authorize", (req, res) => {
    var auth_query_parameters = new URLSearchParams({
		response_type: "code",
		client_id: client_id,
		scope: ["user-library-read", "user-top-read", "playlist-modify-public", "user-read-private"],
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
    // console.log(userInfo);
    const tracks = await getData("/me/tracks?limit=50&offset=0");
    res.cookie("userId", userInfo.id).render("dashboard", { user: userInfo, tracks: tracks.items})
}); 

app.get("/recommendations", async (req, res) => {
    const track_id = req.query.track;
    let params = new URLSearchParams({
        method: "get",
        market: "GB",
        seed_genres: [""],
        seed_tracks: track_id,
        target_instrumentalness: 0.255,
        target_acousticness: 0.378,
        target_energy: 0.550,
        target_valence: 0.418,
    })
    const data = await getData('/recommendations?' + params);
    res.render("recommendation", { tracks: data.tracks});
});

app.use(express.json());
app.use(express.urlencoded({ extended: false}));

app.get("/users/", async function (req, res) {
    console.log(req.body);
    const userId = req.cookies.userId;
    const response = await fetch('https://api.spotify.com/v1/users/' + userId + '/playlists', {
        method: "post",
        //body: body,
        headers: {
            Authorization: "Bearer " + global.access_token,
            "Content-Type": 'application/json',
        },
        body: JSON.stringify({
            name: "Yor-Sounds study playlist",
            public: true,
            collaborative: false,
            description: 'This is a test!',
        })
    })
    let data = await response.json()
    console.log(data)
    res.render("createplaylist", {userId}
    )
})

let listener = app.listen(1410, function () {
console.log(
 "The app is listening on http://localhost:" + listener.address().port
   );
});
