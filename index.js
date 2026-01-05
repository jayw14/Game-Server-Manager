const {Client, Events, SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
const {token} = require('./config.json');
const {createCanvas} = require('canvas');
const fs = require('fs');

const client = new Client({intents: []});

client.once(Events.ClientReady, c => {
    const whitelist = new SlashCommandBuilder().setName("whitelist").setDescription("Used to add yourself to the game server's whitelist").addStringOption((option) => option.setName('username').setDescription('Game Username').setRequired(true));
    client.application.commands.create(whitelist);
});

//checks logs for any update every second and posts it in the designated discord channel if it contains a name on the whitelist and doesnt contain various phrases to reduce clutter.
client.on('clientReady', async ()=>{
    let file = '';
    const logUrl = '[MACHINE IP]/api/client/servers/[SERVER ID]/files/contents?file=%2Flogs%2Flatest.log';
    const logOptions = {
    method: 'GET',
    headers: {
        Accept: 'text/plain, application/json',
        Authorization: 'Bearer [API KEY]'
    }
    };

    try {
        const fileResponse = await fetch(logUrl, logOptions).then(rsp =>rsp);
        file = await fileResponse.text();
    } catch (error) {
        console.error(error);
    }
    getPlayerCount();
    setInterval(async()=>{
        try {
            const logResponse = await fetch(logUrl, logOptions).then(rsp =>rsp);
            const logData = await logResponse.text();
            const diff = logData.split(file).join('');
            if(logData.localeCompare(file) != 0){
                file = logData
                try {
                    let whitelistArray = await getWhitelist();
                    let diffArray = diff.split('\n')
                    for(let i = 0; i < diffArray.length; i++){
                        if(diffArray[i].includes("of a max of"))
                            client.user.setActivity(`Currently playing: ${diffArray[i].substring(diffArray[i].indexOf('are') + 4, diffArray[i].indexOf('of') - 1)}`)
                        if(!diffArray[i].includes("User Authenticator") && !diffArray[i].includes("logged in with entity id") && !diffArray[i].includes("logged in with entity id") && !diffArray[i].includes("lost connection") 
                            && !diffArray[i].includes("too quickly") && !diffArray[i].includes("moved wrongly") && !diffArray[i].includes("new title") && !diffArray[i].includes("too long to log in") && !diffArray[i].includes("kicked for floating") 
                        && !diffArray[i].includes("whitelisted player(s)") && diffArray[i].length != 0){
                            for(let j = 0; j < whitelistArray.length; j++){
                                if(diffArray[i].includes(whitelistArray[j])){
                                    const channelId = '[CHANNEL ID]';
                                    const channel = await client.channels.fetch(channelId);
                                    if(!diffArray[i].includes("of a max of"))
                                        channel.send(diffArray[i].split(']:')[1].substring(1, diffArray[i].split(']:')[1].length)); 
                                    if(diffArray[i].includes("joined the game") || diffArray[i].includes("left the game"))
                                        getPlayerCount();
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                console.error(error);
                }
            }
        } catch (error) {
             console.error(error);
        }
    },1000);
});

//stats checker
client.on('clientReady', async ()=>{
    setInterval(async()=>{
        const now = new Date();
        let status = 0
        if(client.user.presence.activities[0] != undefined)
            status = client.user.presence.activities[0].name.split(": ")[1];
        if(now.getMinutes() == 0 && status > 0){
            let mined = [];
            let minedLength = ("Top Blocks Mined").length;
            let crafted = [];
            let craftedLength = ("Top Items Crafted").length;
            let used = [];
            let usedLength = ("Top Items Used").length;
            let killed = [];
            let killedLength = ("Top Mobs Killed").length;

            const url = '[MACHINE IP]/api/client/servers/[SERVER ID]/files/list?directory=%2Fworld%2Fstats';
            const options = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer [API KEY]'
                }
            };

            try {
                const response = await fetch(url, options).then(rsp =>rsp);
                const data = await response.json();

                for(let i = 0; i < data.data.length; i++){
                    const url = `[MACHINE IP]/api/client/servers/[SERVER ID]/files/contents?file=world%2Fstats%2F${data.data[i].attributes.name}`;
                    const options = {
                        method: 'GET',
                        headers: {
                            Accept: 'text/plain, application/json',
                            Authorization: 'Bearer [API KEY]'
                        }
                    };

                    try {
                        const playerResponse = await fetch(url, options);
                        const playerData = await playerResponse.json().then(rsp =>rsp);

                        Object.keys(playerData.stats['minecraft:mined']).map(e => {
                            let fixedName = e.replace("minecraft:", "").replaceAll("_", " ").toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            let contained = false;
                            for(let j = 0; j < mined.length; j++){
                                if(mined[j].name == fixedName){
                                    mined[j].value += playerData.stats['minecraft:mined'][e];
                                    contained = true;
                                    break;
                                }
                            }
                            if(i == 0 || !contained){
                                mined.push({"name": fixedName, "value":playerData.stats['minecraft:mined'][e]})
                            }
                        });

                        Object.keys(playerData.stats['minecraft:crafted']).map(e => {
                            let fixedName = e.replace("minecraft:", "").replaceAll("_", " ").toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            let contained = false;
                            for(let j = 0; j < crafted.length; j++){
                                if(crafted[j].name == fixedName){
                                    crafted[j].value += playerData.stats['minecraft:crafted'][e];
                                    contained = true;
                                    break;
                                }
                            }
                            if(i == 0 || !contained){
                                crafted.push({"name": fixedName, "value":playerData.stats['minecraft:crafted'][e]})
                            }
                        });

                        Object.keys(playerData.stats['minecraft:used']).map(e => {
                            let fixedName = e.replace("minecraft:", "").replaceAll("_", " ").toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            let contained = false;
                            for(let j = 0; j < used.length; j++){
                                if(used[j].name == fixedName){
                                    used[j].value += playerData.stats['minecraft:used'][e];
                                    contained = true;
                                    break;
                                }
                            }
                            if(i == 0 || !contained){
                                used.push({"name": fixedName, "value":playerData.stats['minecraft:used'][e]})
                            }
                        });

                        Object.keys(playerData.stats['minecraft:killed']).map(e => {
                            let fixedName = e.replace("minecraft:", "").replaceAll("_", " ").toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            let contained = false;
                            for(let j = 0; j < killed.length; j++){
                                if(killed[j].name == fixedName){
                                    killed[j].value += playerData.stats['minecraft:killed'][e];
                                    contained = true;
                                    break;
                                }
                            }
                            if(i == 0 || !contained){
                                killed.push({"name": fixedName, "value":playerData.stats['minecraft:killed'][e]})
                            }
                        });


                    } catch (error) {
                        console.error(error);
                    }
                }

                let sortedMined = mined.sort((a, b) =>{
                    if(a.value > b.value){
                        return -1;
                    }
                    else if (b.value > a.value){
                        return 1;
                    }
                    return 0;
                })

                let sortedCrafted = crafted.sort((a, b) =>{
                    if(a.value > b.value){
                        return -1;
                    }
                    else if (b.value > a.value){
                        return 1;
                    }
                    return 0;
                })

                let sortedUsed = used.sort((a, b) =>{
                    if(a.value > b.value){
                        return -1;
                    }
                    else if (b.value > a.value){
                        return 1;
                    }
                    return 0;
                })

                let sortedKilled = killed.sort((a, b) =>{
                    if(a.value > b.value){
                        return -1;
                    }
                    else if (b.value > a.value){
                        return 1;
                    }
                    return 0;
                })


                let retStr = ""
                const channelId = '[CHANNEL ID]';
                const channel = await client.channels.fetch(channelId);
                let filler = " "
                let dash = "-"

                for(let i = 0; i < 25; i++){ //hardcoded value which will certainly throw an error if any of these fields have <25
                    let minedStr = `${sortedMined[i].name}: ${sortedMined[i].value}`
                    let craftedStr = `${sortedCrafted[i].name}: ${sortedCrafted[i].value}`
                    let usedStr = `${sortedUsed[i].name}: ${sortedUsed[i].value}`
                    let killedStr = `${sortedKilled[i].name}: ${sortedKilled[i].value}`
                    if(minedStr.length > minedLength)
                        minedLength = minedStr.length
                    if(craftedStr.length > craftedLength)
                        craftedLength = craftedStr.length
                    if(usedStr.length > usedLength)
                        usedLength = usedStr.length
                    if(killedStr.length > killedLength)
                        killedLength = killedStr.length
                }
                for(let i = 0; i < 25; i++){ //hardcoded value which will certainly throw an error if any of these fields have <25
                    let minedStr = `${sortedMined[i].name}: ${sortedMined[i].value}`
                    let craftedStr = `${sortedCrafted[i].name}: ${sortedCrafted[i].value}`
                    let usedStr = `${sortedUsed[i].name}: ${sortedUsed[i].value}`
                    let killedStr = `${sortedKilled[i].name}: ${sortedKilled[i].value}`
                    retStr += `| ${minedStr}${filler.repeat(minedLength - minedStr.length)} | ${craftedStr}${filler.repeat(craftedLength - craftedStr.length)} | ${usedStr}${filler.repeat(usedLength - usedStr.length)} | ${killedStr}${filler.repeat(killedLength - killedStr.length)} |\n`
                }
                let titleStr = "| Top Blocks Mined" + filler.repeat(minedLength - ("Top Blocks Mined").length) + " | " 
                + "Top Items Crafted" + filler.repeat(craftedLength - ("Top Items Crafted").length) + " | "
                + "Top Items Used" + filler.repeat(usedLength - ("Top Items Used").length) + " | "
                + "Top Mobs Killed" + filler.repeat(killedLength - ("Top Mobs Killed").length) + " |\n"
                let dashStr =  `| ${dash.repeat(minedLength)} | ${dash.repeat(craftedLength)} | ${dash.repeat(usedLength)} | ${dash.repeat(killedLength)} |\n`
                retStr = titleStr +  dashStr + retStr;
                
                let canvasWidth = 500;
                let canvasHeight = 500;
                const canvas = createCanvas(canvasWidth, canvasHeight);
                const context = canvas.getContext('2d');

                // Add text with spesific font
                context.fillStyle = 'white'
                context.font = '20px monospace';
                context.fillText(retStr, 0, 0);

                canvasWidth = context.measureText(retStr).width + 40;
                canvasHeight = context.measureText(retStr).emHeightDescent + 40;
                const retCanvas = createCanvas(canvasWidth, canvasHeight);
                const retContext = retCanvas.getContext('2d');
                retContext.fillStyle = 'rgb(60,62,79)'
                retContext.fillRect(0, 0, canvasWidth, canvasHeight)

                // Add text with spesific font
                retContext.fillStyle = 'white'
                retContext.font = '20px monospace';
                retContext.fillText(retStr, 20, 40);

                // Make canvas to data URI
                fs.writeFile('text.png', retCanvas.toBuffer("image/png"), (error)=>{
                    if(error){
                        console.log(error)
                    }
                    else {
                        console.log("File Saved")
                    }
                });
                const file = new AttachmentBuilder('text.png');
                const embed = new EmbedBuilder().setTitle('Server Stats:').setImage('attachment://text.png')
                channel.send({ embeds: [embed], files: [file] });
            } catch (error) {
                console.error(error);
            }
        }
    },60000);
});

//allows whitelist command to be run in disc
client.on(Events.InteractionCreate, async (interaction) => {
        const message = `{"command":"whitelist add ${interaction.options.get('username').value}"}`;
        if(interaction.commandName === "whitelist"){
            let whitelistArray = await getWhitelist();
            if(whitelistArray.includes(interaction.options.get('username').value)){
                interaction.reply(`${interaction.options.get('username').value} is already on server whitelist.`)
                return
            }
            const url = '[MACHINE IP]/api/client/servers/[SERVER ID]/command';
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: 'Bearer [API KEY]'
            },
                body: `${message}`
            };

            try {
                await fetch(url, options);
                const discMessage = `${interaction.options.get('username').value} has been added to server whitelist.`
                interaction.reply(discMessage);
            } catch (error) {
                console.log(error);
            }    
        }
    
});

client.login(token);

const getWhitelist = async () =>{
    const whitelistUrl = '[MACHINE IP]/api/client/servers/[SERVER ID]/files/contents?file=whitelist.json';
    const whiteListOptions = {
        method: 'GET',
        headers: {
            Accept: 'text/plain, application/json',
            Authorization: 'Bearer [API KEY]'
        }
    };
    try {
        const whitelistResponse = await fetch(whitelistUrl, whiteListOptions);
        const whitelistData = await whitelistResponse.json();
        let whitelistArray = [];
        for(let i = 0; i < whitelistData.length; i++){
            whitelistArray.push(whitelistData[i].name);
        }
        return whitelistArray;
    } catch (error) {
        return error
    }
};

const getPlayerCount = async () =>{
    const url = '[MACHINE IP]/api/client/servers/[SERVER ID]/command';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer [API KEY]'
        },
            body: `{"command":"list"}`
        };

        try {
            await fetch(url, options);
        } catch (error) {
            console.log(error);
        }    
}
