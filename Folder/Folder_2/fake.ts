class SomeClass{
private add(tables: IDatabaseTables, itemTpl: string, name: string, shortName: string, Description: string)
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
}

{
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
class InsideClass{
     public Func(container: DependencyContainer): void 
    {
        //some code
    }
}
}
