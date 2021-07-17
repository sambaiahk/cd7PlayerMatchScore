const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initialDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1315, () =>
      console.log("Server Up and Running at http://localhost:1315")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initialDbAndServer();

const convertPlayerDbObjectToResponsiveObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDbObjectToResponsiveObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select * from player_details;
    `;
  const playerDetails = await db.all(getPlayersQuery);
  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDbObjectToResponsiveObj(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const GetPlayerId = `
    select * from player_details where player_id = ${playerId};
    `;
  const playerWithId = await db.get(GetPlayerId);
  response.send(convertPlayerDbObjectToResponsiveObj(playerWithId));
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    update player_details set
    player_name = '${playerName}' where player_id = ${playerId};
    `;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchId = `
    select * from match_details
    where match_id = ${matchId};
    `;
  const getMatchWithId = await db.get(getMatchId);
  response.send(convertMatchDbObjectToResponsiveObj(getMatchWithId));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playedMatches = `
    select * from player_match_score
    natural join match_details
    where player_id = ${playerId};
    `;
  const noOfMatches = await db.all(playedMatches);
  response.send(
    noOfMatches.map((eachMatch) =>
      convertMatchDbObjectToResponsiveObj(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchesOfPlayer = `
    select * from player_match_score
    natural join player_details
    where match_id = ${matchId};
    `;
  const NoOfPlayers = await db.all(matchesOfPlayer);
  response.send(
    NoOfPlayers.map((eachPlayer) =>
      convertPlayerDbObjectToResponsiveObj(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    select player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score natural join player_details
    where player_id = ${playerId};
    `;
  const playersMatchD = await db.get(getMatchPlayerQuery);
  response.send(playersMatchD);
});

module.exports = app;
