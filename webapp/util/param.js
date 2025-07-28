sap.ui.define([
], function () {
    "use strict";

    return {
        //All header fields
        headerFieldsList: {
            BusinessNo: {
                identifier: "Identification",
                visible: { create: false, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Type: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: true, create: true, modify: true },
                action: "onTypeChange"
            },
            BusinessName: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            BusinessStatus: {
                identifier: "Identification",
                visible: { create: false, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            UFOName: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            CDG: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            CompanyCode: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Activity: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FS", "OF"], default: false, create: true, modify: true },
                action: "onActivityChange"
            },
            Branche: {
                identifier: "Identification",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Soufam: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FS", "OF"], default: false, create: true, modify: true },
                action: null
            },
            PROJM: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            Site: {
                identifier: "Identification",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            International: {
                identifier: "Identification",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            AncienNumero: {
                identifier: "Identification",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Rgfact: {
                identifier: "Identification",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Facturation"
            Modalr: {
                identifier: "Facturation",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            Avance: {
                identifier: "Facturation",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            plateformDemat: {
                identifier: "Facturation",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            Rtgart: {
                identifier: "Facturation",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            VAT: {
                identifier: "Facturation",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            Currency: {
                identifier: "Facturation",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            Reflet: {
                identifier: "Facturation",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["RF", "FG", "FS", "OF"], default: false, create: true, modify: true },
                action: null
            },
            CurrencyHedging: {
                identifier: "Facturation",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Client"
            NClient: {
                identifier: "Client",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF"], default: false, create: true, modify: true },
                action: "onBpChange"
            },
            CustomerName: {
                identifier: "Client",
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Scclt: {
                identifier: "Client",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Siret: {
                identifier: "Client",
                visible: { create: true, modify: false },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Country: {
                identifier: "Client",
                visible: { create: true, modify: false },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Garantie"
            Assurance: {
                identifier: "Garantie",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
        // "Contrat"
            Mission: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FS", "OF"], default: false, create: true, modify: true },
                action: null
            },
            GroupM: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            Mandata: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            membreGroupement: {
                identifier: "Contrat",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            projetAgora: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            voletEcologie: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Business: {
                identifier: "Contrat",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            eligibleCir: {
                identifier: "Contrat",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI"], default: false, create: true, modify: true },
                action: null
            },
            projetCup: {
                identifier: "Contrat",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Prix"
            Mtctr: {
                identifier: "Prix",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: "onCalcTauxTravaux"
            },
            nonAcquis: {
                identifier: "Prix",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Paring: {
                identifier: "Prix",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            depenseCommercial: {
                identifier: "Prix",
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Travaux"
            Mttrvx: {
                identifier: "Travaux",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: "onCalcTauxTravaux"
            },
            Ingtrvx: {
                identifier: "Travaux",
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Info"
            Period: {
                identifier: "Info",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Duree"
            StartDate: {
                identifier: "Duree",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            EndDate: {
                identifier: "Duree",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            NbOfMonth: {
                identifier: "Duree",
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            RemainingMonth: {
                identifier: "Duree",
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        // "Qualite"
            UrlCup: {
                identifier: "Qualite",
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
        },
        //All Section except header fields Section
        headerSectionList: {
            summary: { 
                key: "AfterFacet::ZC_FGASet::GeneralInfo::Section",
                visible: {
                    create: false,
                    modify: true
                }
            },
            budget: {
                key: "AfterFacet::ZC_FGASet::TableInfo::Section",
                visible: {
                    create: false,
                    modify: true
                }
            },
            missions: {
                key : "AfterFacet::ZC_FGASet::Missions::Section",
                visible: {
                    create: false,
                    modify: false
                }
            },
            graphic: {
                key : "template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1",
                visible: {
                    create: false,
                    modify: true
                }
            }
        }
    };
});