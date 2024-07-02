import http from "http";
import fs from "fs";
import path from "path";

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/stock" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const sendStockData = async () => {
      const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=cq1jkhhr01qjh3d5psvgcq1jkhhr01qjh3d5pt00`;
      try {
        const response = await fetch(url);
        const json = await response.json();
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(
          16
        )}`; // Generate a random color

        const stockData = {
          c: json.c,
          d: json.d,
          dp: json.dp,
          h: json.h,
          l: json.l,
          o: json.o,
          pc: json.pc,
          t: json.t,
          color: randomColor, // Add the fake attribute
        };

        res.write(`data: ${JSON.stringify(stockData)}\n\n`);
      } catch (err) {
        console.error("Error fetching stock data:", err);
      }
    };

    sendStockData(); // Send initial data immediately
    const intervalId = setInterval(sendStockData, 5000);

    req.on("close", () => {
      clearInterval(intervalId);
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
