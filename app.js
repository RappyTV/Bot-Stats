const express = require('express');
const app = express();
const http = require('http');
const parser = require('body-parser');
const { default: axios } = require(`axios`);

global.server = {};
server.cfg = require('./config.json');
server.guilds = new Map();

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
        bots: server.cfg.bots.map((bot) => Object.assign({ guilds: server.guilds.has(bot.id) ? `${server.guilds.get(bot.id)} Guilds` : `No value cached yet!` }, bot)),
        version: require('./package.json').version
    };
    next();
});

app.get(`/`, (req, res) => {
    res.render(`index`);
});

const sentNotifications = [];
app.post(`/bots/:id`, (req, res) => {
    if(req.headers.authorization != server.cfg.authorization) return res.status(401).json({ error: `You are not authorized to do this!` });
    const bot = server.cfg.bots.find((bot) => bot.id == req.params.id);
    if(!bot) return res.status(400).json({ error: `This bot is not in our list!` });
    if(req.body.guilds == null) return res.status(400).json({ error: `You have to provide a guild count!` });
    if(typeof req.body.guilds != `number` || req.body.guilds < 0) return res.status(400).json({ error: `The guild count has to be a valid number above 0!` });
    server.guilds.set(req.params.id, req.body.guilds);
    res.status(200).json({ message: `Successfully cached guild count!` });

    if(!server.cfg.notifications.enabled || req.body.guilds % server.cfg.notifications.triggerModulus != 0) return;
    if(sentNotifications.includes(req.body.guilds)) return;
    sentNotifications.push(req.body.guilds);

    axios.post(
        server.cfg.notifications.server.replaceAll(`<user>`, server.cfg.notifications.user),
        { message: `🎉🎉 ${bot.name} hast just reached ${req.body.guilds} guilds!` },
        { headers: { Authorization: server.cfg.notifications.key } }
    ).catch(console.error);
});