const express = require('express');
const app = express();
const http = require('http');
const parser = require('body-parser');

global.server = {};
server.cfg = require('./config.json');
server.members = new Map();

app.use(express.static('./src/public'));
app.use(parser.json());
app.set('view engine', 'ejs');
app.set('views', './src/views');

server.app = http.createServer(app).listen(server.cfg.port, () => {
    console.log(`[SERVER] Server is running on port ${server.cfg.port}`);
});

app.use((req, res, next) => {
    res.locals = {
        base: server.cfg.base,
        icons: server.cfg.iconRetreiver,
        bots: server.cfg.bots.map((bot) => Object.assign({ members: server.members.has(bot.id) ? `${server.members.get(bot.id)}` : `No value cached yet!` }, bot)),
        version: require('./package.json').version
    };
    next();
});

app.get(`/`, (req, res) => {
    res.render(`index`);
});

app.post(`/bots/:id`, (req, res) => {
    if (!req.body.members) return res.status(400).json({ error: `You have to provide a member count!` });
    server.members.set(req.params.id, req.body.members);
    res.status(200).json({ message: `Successfully cached member count!` });
});