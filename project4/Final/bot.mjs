import dotenv from "dotenv";
dotenv.config();

import { createRestAPIClient } from "masto";

const masto = createRestAPIClient({
  url: "https://networked-media.itp.io/",
  accessToken: process.env.TOKEN,
});

async function retrieveData() {
  const url = "http://161.35.96.190:7001/all-posts";
  const response = await fetch(url);
  const json = await response.json();
  const posts = json.posts;
  let randNum = Math.floor(Math.random() * posts.length);
  console.log(posts[randNum].text);
  let randText = posts[randNum].text;
  makeStatus(randText);
}
async function makeStatus(textStatus) {
  const status = await masto.v1.statuses.create({
    status: textStatus,
    visibility: "public",
  });
}
setInterval(() => {
  retrieveData();
}, 3600000);

retrieveData();
