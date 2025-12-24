sap.ui.define([
], function () {
    "use strict";

    return {
        defaultNA:
        {
            "RF": [
                { identifier: "Garantie", field: "Assurance", value: "NA" }
            ],
            "FG": [
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "FS": [
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "OF": [
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
            ],
            "PI": [
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "PC": [
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
        },
        headerProjectFieldList: {
            BusinessNo: {
                identifier: "Identification",
                visible: true,
            },
            Type: {
                identifier: "Identification",
                visible: true,
            },

            BusinessType: {
                identifier: "Identification",
                visible: false,
            },
            BusinessName: {
                identifier: "Identification",
                visible: true,
            },
            BusinessStatus: {
                identifier: "Identification",
                visible: false,
            },
            UFOName: {
                identifier: "Identification",
                visible: false,
            },
            CDG: {
                identifier: "Identification",
                visible: false,
            },
            CompanyCode: {
                identifier: "Identification",
                visible: false,
            },
            Activity: {
                identifier: "Identification",
                visible: false,
            },
            Branche: {
                identifier: "Identification",
                visible: false,
            },
            Soufam: {
                identifier: "Identification",
                visible: false,
            },
            PROJM: {
                identifier: "Identification",
                visible: true,
            },
            Site: {
                identifier: "Identification",
                visible: false,
            },
            International: {
                identifier: "Identification",
                visible: false,
            },
            AncienNumero: {
                identifier: "Identification",
                visible: false,
            },
            Rgfact: {
                identifier: "Identification",
                visible: false,
            },
            Reflet: {
                identifier: "Identification",
                visible: false,
            },
            // "Facturation"
            Modalr: {
                identifier: "Facturation",
                visible: false,
            },
            Avance: {
                identifier: "Facturation",
                visible: false,
            },
            plateformDemat: {
                identifier: "Facturation",
                visible: false,
            },
            Rtgart: {
                identifier: "Facturation",
                visible: false,
            },
            VAT: {
                identifier: "Facturation",
                visible: false,
            },
            Currency: {
                identifier: "Facturation",
                visible: false,
            },

            CurrencyHedging: {
                identifier: "Facturation",
                visible: false,
            },
            // "Client"
            NClient: {
                identifier: "Client",
                visible: false,
            },
            CustomerName: {
                identifier: "Client",
                visible: false,
            },
            Scclt: {
                identifier: "Client",
                visible: false,
            },
            Siret: {
                identifier: "Client",
                visible: false,
            },
            Country: {
                identifier: "Client",
                visible: false,
            },
            // "Garantie"
            Assurance: {
                identifier: "Garantie",
                visible: false,
            },
            // "Contrat"
            Mission: {
                identifier: "Contrat",
                visible: false,
            },
            GroupM: {
                identifier: "Contrat",
                visible: false,
            },
            isMandataire: {
                identifier: "Contrat",
                visible: false,
            },
            Mandata: {
                identifier: "Contrat",
                visible: false,
            },
            membreGroupement: {
                identifier: "Contrat",
                visible: false,
            },
            projetAgora: {
                identifier: "Contrat",
                visible: false,
            },
            voletEcologie: {
                identifier: "Contrat",
                visible: false,
            },
            Business: {
                identifier: "Contrat",
                visible: false,
            },
            eligibleCir: {
                identifier: "Contrat",
                visible: false,
            },
            projetCup: {
                identifier: "Contrat",
                visible: false,
            },
            // "Prix"
            Mtctr: {
                identifier: "Prix",
                visible: false,
            },
            nonAcquis: {
                identifier: "Prix",
                visible: false,
            },
            Paring: {
                identifier: "Prix",
                visible: false,
            },
            depenseCommercial: {
                identifier: "Prix",
                visible: false,
            },
            // "Travaux"
            Mttrvx: {
                identifier: "Travaux",
                visible: false,
            },
            Ingtrvx: {
                identifier: "Travaux",
                visible: false,
            },
            // "Info"
            Period: {
                identifier: "Info",
                visible: false,
            },
            ModifyBy: {
                identifier: "Info",
                visible: true,
            },
            ModifyDate: {
                identifier: "Info",
                visible: true,
            },
            // "Duree"
            StartDate: {
                identifier: "Duree",
                visible: false,
            },
            EndDate: {
                identifier: "Duree",
                visible: false,
            },
            NbOfMonth: {
                identifier: "Duree",
                visible: false,
            },
            RemainingMonth: {
                identifier: "Duree",
                visible: false,
            },
            // "Qualite"
            UrlCup: {
                identifier: "Qualite",
                visible: false,
            },
            // "BudgetObjectif"
            Recettes: {
                identifier: "BudgetObjectif",
                visible: false,
            },
            Depenses: {
                identifier: "BudgetObjectif",
                visible: false,
            },
            //AffaireEmise
            business_e_N1: {
                identifier: "BudgetObjectif",
                visible: false,
            },
            business_cdp_N1: {
                identifier: "BudgetObjectif",
                visible: false,
            },
        },

        //All header fields
        headerFieldsList: {
            BusinessNo: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },

            Type: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: false },
                enabled: { create: true, modify: false },
                mandatory: { type: [], default: true, create: true, modify: true },
                action: "onTypeChange"
            },

            BusinessType: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: false },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: true, create: true, modify: true },
                action: "onTypeChange"
            },
            BusinessName: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            BusinessStatus: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            UFOName: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: false },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: 'onUFOChange'
            },
            CDG: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: false },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: 'onCDGChange'
            },
            CompanyCode: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Activity: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "OF"], default: false, create: true, modify: true },
                action: "onActivityChange"
            },
            Branche: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Soufam: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "OF"], default: false, create: true, modify: true },
                action: null
            },
            PROJM: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            Site: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            International: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            AncienNumero: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Rgfact: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: false },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: false, modify: false },
                action: null
            },
            Reflet: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Facturation"
            Modalr: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Avance: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            plateformDemat: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Rtgart: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            VAT: {
                identifier: "Facturation",
                defaultValue: { create: "20", modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            Currency: {
                identifier: "Facturation",
                defaultValue: { create: "EUR", modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: "onCurrencyChange"
            },

            CurrencyHedging: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Client"
            NClient: {
                identifier: "Client",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF"], default: false, create: true, modify: true },
                action: "onBpChange"
            },
            CustomerName: {
                identifier: "Client",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Scclt: {
                identifier: "Client",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                // mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Siret: {
                identifier: "Client",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Country: {
                identifier: "Client",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Garantie"
            Assurance: {
                identifier: "Garantie",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            // "Contrat"
            Mission: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF"], default: false, create: true, modify: true },
                action: null
            },
            GroupM: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Mandata: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            membreGroupement: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            projetAgora: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            voletEcologie: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Business: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            eligibleCir: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            projetCup: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Prix"
            Mtctr: {
                identifier: "Prix",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: "onCalcTauxTravaux"
            },
            nonAcquis: {
                identifier: "Prix",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Paring: {
                identifier: "Prix",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            depenseCommercial: {
                identifier: "Prix",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Travaux"
            Mttrvx: {
                identifier: "Travaux",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: "onCalcTauxTravaux"
            },
            Ingtrvx: {
                identifier: "Travaux",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "Info"
            Period: {
                identifier: "Info",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            ModifyBy: {
                identifier: "Info",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: false, modify: false },
                action: null
            },
            ModifyDate: {
                identifier: "Info",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: false, modify: false },
                action: null
            },
            // "Duree"
            StartDate: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            EndDate: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            NbOfMonth: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            RemainingMonth: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "PC"], default: false, create: true, modify: true },
                action: null
            },
            // "Qualite"
            UrlCup: {
                identifier: "Qualite",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "BudgetObjectif"
            Recettes: {
                identifier: "BudgetObjectif",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            // "BudgetObjectif"
            Depenses: {
                identifier: "BudgetObjectif",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            business_cdp_N1: {
                identifier: "AffaireEmise",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: false, modify: false },
                action: null
            },

        },
        //All Section except header fields Section
        headerSectionList: {
            generalInfoMain: {
                key: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--GeneralInfo::SubSection", 
                visible: {
                    create: true,
                    modify: true,
                    forecast: false,
                }
            },
            summary: {
                key: "AfterFacet::ZC_FGASet::GeneralInfo::Section",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },
            tabRacap: {
                key: "AfterFacet::ZC_FGASet::GeneralInfo::Section",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },
            budget: {
                key: "AfterFacet::ZC_FGASet::TableInfo::Section",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },
            graphic: {
                key: "BeforeFacet::ZC_FGASet::TableInfo::Section",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },
            note: {
                // AfterFacet|ZC_FGASet|GeneralInfo|1
                key: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },

            fgp: {
                // AfterFacet|ZC_FGASet|TableInfo|1
                key: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::TableInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1",
                visible: {
                    create: false,
                    modify: true,
                    forecast: false,
                }
            },
            prevision: {
                key: "AfterFacet::ZC_FGASet::Prevision::Section",
                visible: {
                    create: false,
                    modify: false,
                    forecast: true,
                }
            },
            // com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::TableInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1

            // com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--objectPage-anchBar-com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1-anchor
        }
    };
});