class PunisherBossMod implements IPreAkiLoadMod, IPostDBLoadMod 
{
    private static readonly spawnChanceDefault = 1;
    private static readonly spawnChanceIncrement = .5;
    public static sessionID: string;
    private static punisherSpawnChance: number;
    public static modName = "PunisherChance";
    public static databaseServer: DatabaseServer;
    public static modFolder = path.dirname(__filename);
    public static progressRecord: {
        SessionID: string;
        successfulConsecutiveRaids: number;
        failedConsecutiveRaids: number;
        actualPunisherChance: number;
    };
      
    mod: string
    logger: ILogger;

    constructor() 
    {
        this.mod = "PunisherBossMod";
    }

    public preAkiLoad(container: DependencyContainer): void 
    {
        try 
        {
            const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");

            staticRouterModService.registerStaticRouter(
                `${PunisherBossMod.modName}:ProfileSelected`,
                [
                    {
                        url: "/client/game/profile/select",
                        action: (url, info, sessionId, output) => 
                        {
                            PunisherBossMod.sessionID = sessionId;
                            return output;
                        }
                    }
                ],
                "aki"
            );

            // Raid Saving (End of raid)
            staticRouterModService.registerStaticRouter(
                `${PunisherBossMod.modName}:RaidSaved`,
                [
                    {
                        url: "/raid/profile/save",
                        action: (url, info, sessionId, output) => 
                        {
                            console.log("PUNISHER: Info:", info);

                            if (info && info.profile && info.profile.Stats && info.profile.Stats.Victims && info.profile.Stats.Aggressor) 
                            {
                               console.log("PUNISHER: Victims:", info.profile.Stats.Victims);
                               console.log("PUNISHER: Aggressor:", info.profile.Stats.Aggressor);
                            }
                            else 
                            {
                               console.log("PUNISHER: Victims or Aggressor array (table info) is not present in the profile.");
                            }
                            PunisherBossMod.removeBossSpawnFromMaps();
                            PunisherBossMod.onRaidSave(url, info, sessionId, output);
                            PunisherBossMod.setBossChanceFromProgressFile();
                            return output;
                        }
                    }
                ],
                "aki"
            );
        }
        catch (error) 
        {
            this.logger.error(error);
        }
    }

    public postDBLoad(): void 
    {
        try 
        {
            console.log("PUNISHER:postDBLoad (after database loads (weapons, items, etc))");
      
            const progressFilePath = `${PunisherBossMod.modFolder}/progress.json`;
      
            if (fs.existsSync(progressFilePath)) 
            {
                console.log("PUNISHER:Progress file exists, loading...");
                PunisherBossMod.progressRecord = PunisherBossMod.readFile(progressFilePath);
      
                if (PunisherBossMod.progressRecord && PunisherBossMod.progressRecord.actualPunisherChance > 100) 
                {
                    console.log("PUNISHER: Loaded spawn chance exceeds the maximum limit, setting to 100.");
                    PunisherBossMod.progressRecord.actualPunisherChance = 100;
                }
                else if (PunisherBossMod.progressRecord && PunisherBossMod.progressRecord.actualPunisherChance < 1) 
                {
                    console.log("PUNISHER: Loaded spawn chance is less than 1, setting to 1.");
                    PunisherBossMod.progressRecord.actualPunisherChance = 1;
                }
                  
                // Save the updated progress record to the file
                PunisherBossMod.saveToFile(PunisherBossMod.progressRecord, progressFilePath);
                console.log("PUNISHER: Save the updated progress record to the file.Progress file updated.");                  
      
                console.log("PUNISHER: Progress file loaded:", PunisherBossMod.progressRecord);
            }
            else 
            {
                console.log("PUNISHER: Progress file does not exist. This is Normal.");
            }
        }
        catch (error) 
        {
            console.error("PUNISHER: An error occurred in postDBLoad:", error);
        }

        PunisherBossMod.removeBossSpawnFromMaps();
        PunisherBossMod.setBossChanceFromProgressFile();
    }

    static removeBossSpawnFromMaps() 
    {
        const tables = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const removedLocations = [];
    
        for (const location of Object.values(tables.locations)) 
        {
            if (location.base) 
            {
                const removedSpawns = location.base.BossLocationSpawn.filter(spawn => spawn.BossName === "bosspunisher");
                location.base.BossLocationSpawn = location.base.BossLocationSpawn.filter(spawn => spawn.BossName !== "bosspunisher");
    
                if (removedSpawns.length > 0) 
                {
                    removedLocations.push({
                        map: location.base.Id,
                        zones: removedSpawns.map(spawn => spawn.BossZone)
                    });
                }
            }
        }
    
        if (removedLocations.length > 0) 
        {
            console.log("PUNISHER: Removed bosspunisherSpawn from the following maps and zones:");
            for (const removedLocation of removedLocations) 
            {
                const { map, zones } = removedLocation;
                console.log(`- Map: ${map}, Zones: ${zones.join(", ")}`);
            }
        }
        else 
        {
            console.log("PUNISHER: No bosspunisherSpawn found in any maps and zones.");
        }
    }
    

    static setBossChanceFromProgressFile() 
    {
        const progressFilePath = `${PunisherBossMod.modFolder}/progress.json`;


        let actualPunisherChance = 1; // Default value if progress.json is not found

        try 
        {
            const progressData = JSON.parse(fs.readFileSync(progressFilePath, "utf8"));
            actualPunisherChance = progressData?.actualPunisherChance ?? 1;
        }
        catch (error) 
        {
            console.log("PUNISHER:A Progress File (that will set Boss Chance) will be generated on your next raid");
        }
    

        let bosspunisherSpawn: BossLocationSpawn = {
            BossChance: actualPunisherChance,
            BossDifficult: "impossible",
            BossEscortAmount: "2",
            BossEscortDifficult: "impossible",
            BossEscortType: "exUsec",
            BossName: "bosspunisher",
            BossPlayer: false,
            BossZone: "?",
            RandomTimeSpawn: false,
            Time: -1,
            TriggerId: "",
            TriggerName: ""
        };

        console.log("PUNISHER: Punisher BossChance:", bosspunisherSpawn.BossChance);

        const tables = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        const botConfig = container.resolve<ConfigServer>("ConfigServer").getConfig<IBotConfig>(ConfigTypes.BOT);
        const batch: any = botConfig.presetBatch;
        const stupidfuckingbotsettings = {
            "nvgIsActiveChanceDayPercent": 10,
            "nvgIsActiveChanceNightPercent": 90,
            "faceShieldIsActiveChancePercent": 100,
            "lightIsActiveDayChancePercent": 25,
            "lightIsActiveNightChancePercent": 90,
            "weaponSightWhitelist": {},
            "laserIsActiveChancePercent": 85,
            "weightingAdjustments": [],
            "randomisation": [],
            "blacklist": [],
            "whitelist": [],
            "clothing": [],
            "weaponModLimits": {
                "scopeLimit": 1,
                "lightLaserLimit": 1
            }
        };
        botConfig.equipment["bosspunisher"] = stupidfuckingbotsettings;
        batch.bosspunisher = 1;
        botConfig.bosses.push("bosspunisher");
        botConfig.itemSpawnLimits["bosspunisher"] = {};
		botConfig.lootNValue["bosspunisher"] = 4;
        tables.bots.types["bosspunisher"] = jsonUtil.deserialize(jsonUtil.serialize(bosspunisher));

        for (const location of Object.values(tables.locations)) 
        {
            if (location.base) 
            {
                const zonesString = location.base.Id === "factory4_night" ? tables.locations.factory4_day.base.OpenZones : location.base.OpenZones;
                if (!zonesString) 
                {
                    continue;
                }
        
                const foundOpenZones = zonesString
                    .split(",")
                    .map(zone => zone.trim())
                    .filter(zone => zone && !zone.includes("Snipe"));
        
                if (foundOpenZones.length === 0) 
                {
                    continue;
                }
        
                const randomIndex = Math.floor(Math.random() * foundOpenZones.length);
                const randomZone = foundOpenZones[randomIndex];
        
                bosspunisherSpawn = {
                    ...bosspunisherSpawn,
                    BossZone: randomZone
                };
        
                location.base.BossLocationSpawn.push(bosspunisherSpawn);
        
                console.log(`PUNISHER: Added The Punisher to map: ${location.base.Id}, zone: ${randomZone}`);
            }
        }
        
    } 
    

      

    private static saveToFile(data: any, filePath: string): void 
    {
        try 
        {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
            console.log("PUNISHER:Data written successfully! (Save to FILE)");
        }
        catch (error) 
        {
            console.error("PUNISHER:Error writing data: (Save TO file) " + error);
        }
        console.log("PUNISHER:Saved File: (in Save to file) " + filePath);
    }

    public static createProgressFile(
        successful: number,
        failed: number,
        sessionID: string,
        punisherSpawnChance: number
        
    ): void 
    {
        const progressFile = PunisherBossMod.progressRecord = {
            SessionID: sessionID,
            successfulConsecutiveRaids: successful,
            failedConsecutiveRaids: failed,
            actualPunisherChance: punisherSpawnChance
        };
        PunisherBossMod.saveToFile(progressFile, `${PunisherBossMod.modFolder}/progress.json`);
        PunisherBossMod.progressRecord = progressFile;
    }
    static readFile(filePath: string): any 
    {
        try 
        {
            const jsonString = fs.readFileSync(filePath, "utf-8");
            const decryptedData = JSON.parse(jsonString);
            return decryptedData;
        }
        catch (err) 
        {
            console.log(`PUNISHER: No file exists at: ${filePath}. This is Normal`);
            return null;
        }
    }
	
    static onRaidSave(url: string, info: any, sessionId: string, output: string) 
    {
        if (PunisherBossMod.progressRecord && info.exit === "Left") 
        {
            return;
        }
        try 
        {
            console.log("PUNISHER:onRaidSave now");
      
            // try read values from progress record and if not, set them to default
            let successfulConsecutiveRaids = 0;
            let failedConsecutiveRaids = 0;
            let punisherSpawnChance = 1;
      
            if (!PunisherBossMod.progressRecord) 
            {
                console.log("PUNISHER:Progress file not found, creating new file");
                PunisherBossMod.createProgressFile(0, 0, sessionId, 5);
                PunisherBossMod.progressRecord = PunisherBossMod.readFile(
                    `${PunisherBossMod.modFolder}/progress.json`
                );
                console.log("PUNISHER: After progress file creation:", PunisherBossMod.progressRecord);
            }
            else 
            {
                successfulConsecutiveRaids = PunisherBossMod.progressRecord.successfulConsecutiveRaids;
                failedConsecutiveRaids = PunisherBossMod.progressRecord.failedConsecutiveRaids;
                punisherSpawnChance = PunisherBossMod.progressRecord.actualPunisherChance;
                console.log("PUNISHER: After progress file read:", successfulConsecutiveRaids, failedConsecutiveRaids, punisherSpawnChance);
            }
      
            if (PunisherBossMod.progressRecord && info.exit === "survived") 
            {
                successfulConsecutiveRaids++;
                failedConsecutiveRaids = 0;
                punisherSpawnChance += (PunisherBossMod.spawnChanceIncrement * successfulConsecutiveRaids);
                console.log("PUNISHER:You survived the raid! But someone noticed you leaving...");
            }
            else if (PunisherBossMod.progressRecord && info.exit === "killed") 
            {
                failedConsecutiveRaids++;
                successfulConsecutiveRaids = 0;
                punisherSpawnChance -= (PunisherBossMod.spawnChanceIncrement * failedConsecutiveRaids);
                console.log("PUNISHER: You didn't make it to extract. Shit luck.");
            }
            else if (PunisherBossMod.progressRecord && info.exit === "runner") 
            {
                punisherSpawnChance += PunisherBossMod.spawnChanceIncrement;
                console.log("PUNISHER: Runner Status. Your raid was not counted.");
            }
      
            const victimRoles = info.profile.Stats.Victims?.map(victim => victim.Role.toLowerCase());
            const aggressorName = info.profile.Stats.Aggressor?.Name?.toLowerCase();
      
            if (victimRoles?.includes("bosspunisher")) 
            {
                punisherSpawnChance /= 4; // Reduce spawn chance by 1/4
                console.log("PUNISHER: You gatted the Punisher down! He's going to need some time to heal, but he'll be back soon...");
            }
            else 
            {
                //console.log("couldn't find bosspunisher in victims");
            }
      
            if (victimRoles?.includes("exusec")) 
            {
                const exusecVictims = victimRoles.filter(role => role === "exusec");
                const exusecCount = exusecVictims.length;
                punisherSpawnChance += PunisherBossMod.spawnChanceIncrement * exusecCount;
                console.log(`PUNISHER: The more Rogues you kill, the more you're gonna piss off Frank... Killed ${exusecCount} exusec.`);
            }
            else 
            {
                console.log("PUNISHER: couldn't find exusec in victims");
            }
      
            if (aggressorName === "frank castle") 
            {
                punisherSpawnChance = PunisherBossMod.spawnChanceDefault;
                console.log("PUNISHER: The Punisher always gets his vengeance. You'll be safe for a while, but if you keep pissing Frank off he'll be back.");
            }
            else 
            {
                console.log("PUNISHER:couldn't find frank castle in aggressor");
            }
            if (punisherSpawnChance > 100) 
            {
                punisherSpawnChance = 100; // Set the spawn chance to the maximum limit
            }
            if (punisherSpawnChance < 1) 
            {
                punisherSpawnChance = 1; // Set the spawn chance to the minimum limit
            }
      
            if (PunisherBossMod.progressRecord) 
            {
                console.log(`PUNISHER: Updated progress file {SuccessfulConsecutiveRaids: ${successfulConsecutiveRaids}, FailedConsecutiveRaids: ${failedConsecutiveRaids}, actualPunisherChance: ${punisherSpawnChance}}`);
                PunisherBossMod.createProgressFile(successfulConsecutiveRaids, failedConsecutiveRaids, sessionId, punisherSpawnChance);
                console.log("PUNISHER: ProgressFile created successfully!");
            }
      
            return output;
        }
        catch (error) 
        {
            console.error("PUNISHER:An error occurred in onRaidSave:", error);
            return output;
        }
    }
      

        
}
