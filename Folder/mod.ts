/* eslint-disable @typescript-eslint/brace-style */
/* eslint-disable @typescript-eslint/no-var-requires */
import { DependencyContainer } from "tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ISuit, ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { UUidGenerator } from "@spt-aki/utils/UUidGenerator";


// USEC Contractor \\
import * as contractor_top from "../db/contractor_top.json";
import * as contractor_hands from "../db/contractor_hands.json";
import * as contractor_pants from "../db/contractor_pants.json";
import * as contractor_head from "../db/contractor_head.json";


import * as contractor_top_suit from "../db/contractor_top_suit.json";
import * as contractor_pants_suit from "../db/contractor_pants_suit.json";

import * as commander_rig from "../db/commander-rig.json";
import * as  commander_rig_locale from "../db/commander-rig_locale.json";

import * as useccommander from "../db/useccommander.json";

import * as contractor_locale from "../db/contractor_locale.json";
// USEC Contractor \\

import * as tradersuits from "../db/suits.json";



import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";


import { BossLocationSpawn } from "@spt-aki/models/eft/common/ILocationBase";
import { ICustomizationItem } from "@spt-aki/models/eft/common/tables/ICustomizationItem";
import { table } from "console";

class SecondClass{
    public someFunc(){
        //some code
    }
}
class ThirdClass{
    public two(){
        //some code
    }
     public three(){
        //some code
    }
     public five(){
        //some code
    }
}
class SampleTrader implements IPostDBLoadMod {
    mod: string
    logger: ILogger;

    constructor() {
        this.mod = "servph-usec-commander";
    }

    public postDBLoad(container: DependencyContainer): void {
        const tables = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");

        tables.templates.items[commander_rig._id] = commander_rig;
        this.addItemToLocales(tables, commander_rig._id, commander_rig_locale.Name, commander_rig_locale.ShortName, commander_rig_locale.Description);
        this.addClothingItemToLocales(tables, contractor_top_suit._id, contractor_locale.Name, contractor_locale.ShortName, contractor_locale.Description);
        this.addClothingItemToLocales(tables, contractor_pants_suit._id, contractor_locale.Name, contractor_locale.ShortName, contractor_locale.Description);


        // USEC Contractor \\
        tables.templates.customization[contractor_top._id] = contractor_top as ICustomizationItem 
        tables.templates.customization[contractor_hands._id] = contractor_hands as ICustomizationItem
        tables.templates.customization[contractor_pants._id] = contractor_pants as ICustomizationItem 
        tables.templates.customization[contractor_head._id] = contractor_head as ICustomizationItem

        tables.templates.customization[contractor_top_suit._id] = contractor_top_suit as ICustomizationItem
        tables.templates.customization[contractor_pants_suit._id] = contractor_pants_suit as ICustomizationItem

        
        console.log("USEC_COMMANDER: Adding suits to traders!")
        Object.values(tradersuits).forEach(suit => {
            tables.traders["5ac3b934156ae10c4430e83c"].suits.push(suit);
        });
        


        // bot stuff
        const botConfig = container.resolve<ConfigServer>("ConfigServer").getConfig<IBotConfig>(ConfigTypes.BOT);
        const batch: any = botConfig.presetBatch;
        batch.useccommander = 5;

        console.log("USEC_COMMANDER: Pushing boss to BotConfig")

        botConfig.bosses.push("useccommander");
        tables.bots.types["useccommander"] = jsonUtil.deserialize(jsonUtil.serialize(useccommander));

        const useccommanderSpawn: BossLocationSpawn = {
            BossChance: 1,
            BossDifficult: "impossible",
            BossEscortAmount: "4",
            BossEscortDifficult: "impossible",
            BossEscortType: "exUsec",
            BossName: "useccommander",
            BossPlayer: false,
            BossZone: "?",
            RandomTimeSpawn: false,
            Time: -1,
            TriggerId: "",
            TriggerName: ""
        };

        console.log(`USEC_COMMANDER: BossLocationSpawn ${useccommanderSpawn}`)

        for (const location of Object.values(tables.locations)) {
            if (location.base) {
                const zones = location.base.Id == "factory4_night" ? tables.locations.factory4_day.base.OpenZones : location.base.OpenZones;
                if (zones.length == 0) {
                    continue;
                }

                useccommanderSpawn.BossZone = location.base.OpenZones;
                location.base.BossLocationSpawn.push(useccommanderSpawn);
                console.log(`USEC_COMMANDER: Added Usec Commander to ${location.base.Id}`);
            }
        }

        // USEC Contractor \\




        
        const uuidGenerator = container.resolve<UUidGenerator>("UUidGenerator");
    }

    private addItemToLocales(tables: IDatabaseTables, itemTpl: string, name: string, shortName: string, Description: string)
    {
        // For each language, add locale for the new trader
        console.log(`USEC_COMMANDER: For each language, adding item locale for the new trader `);
        const locales = Object.values(tables.locales.global) as Record<string, string>[];
        for (const locale of locales) {
            locale[`${itemTpl} Name`] = name;
            locale[`${itemTpl} ShortName`] = shortName;
            locale[`${itemTpl} Description`] = Description;
        }
    }

    private addClothingItemToLocales(tables: IDatabaseTables, ClothingTpl: string, name: string, shortName: string, Description: string)
    {
        // For each language, add locale for the new trader
        console.log(`USEC_COMMANDER: For each language, adding CLothing Item locale for the new trader `);
        const locales = Object.values(tables.locales.global) as Record<string, string>[];
        for (const locale of locales) {
            locale[`${ClothingTpl} Name`] = name;
            locale[`${ClothingTpl} ShortName`] = shortName;
            locale[`${ClothingTpl} Description`] = Description;
        }
    }
}

module.exports = { mod: new SampleTrader() }
