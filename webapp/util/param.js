sap.ui.define([
], function () {
    "use strict";

    return {
        defaultNA:
        {
            "RF":[
                { identifier: "Garantie", field: "Assurance", value: "NA" }
            ],
            "FG":[
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "FS":[
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "OF":[
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ],
            "PI":[
                { identifier: "Identification", field: "Activity", value: "FGE" },
                { identifier: "Identification", field: "Soufam", value: "NAA" },
                { identifier: "Garantie", field: "Assurance", value: "NA" },
                { identifier: "Contrat", field: "Mission", value: "NOTA" },
            ]
        }
        ,
        //All header fields
        headerFieldsList: {
            BusinessNo: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: false, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Type: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: true, create: true, modify: true },
                action: "onTypeChange"
            },
            BusinessName: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
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
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            CDG: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
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
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            Site: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            International: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            AncienNumero: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: true, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Rgfact: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Reflet: {
                identifier: "Identification",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
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
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            Rtgart: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            VAT: {
                identifier: "Facturation",
                defaultValue: { create: 20, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            Currency: {
                identifier: "Facturation",
                defaultValue: { create: "EUR", modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: null
            },
            
            CurrencyHedging: {
                identifier: "Facturation",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
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
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
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
                visible: { create: true, modify: false },
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
                visible: { create: true, modify: false },
                enabled: { create: true, modify: true },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            eligibleCir: {
                identifier: "Contrat",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: false },
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
                visible: { create: true, modify: false },
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
                visible: { create: true, modify: false },
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
        // "Duree"
            StartDate: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            EndDate: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: true, modify: true },
                mandatory: { type: ["PO", "OI", "RF", "FG", "FS", "OF", "PI"], default: false, create: true, modify: true },
                action: "onDateChange"
            },
            NbOfMonth: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
                action: null
            },
            RemainingMonth: {
                identifier: "Duree",
                defaultValue: { create: null, modify: null },
                visible: { create: true, modify: true },
                enabled: { create: false, modify: false },
                mandatory: { type: [], default: false, create: true, modify: true },
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
        },
        //All Section except header fields Section
        headerSectionList: {
            info: {
                key: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--com.sap.vocabularies.UI.v1.FieldGroup::Info::FormGroup",
                visible: {
                    create: false,
                    modify: true
                }
            },
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