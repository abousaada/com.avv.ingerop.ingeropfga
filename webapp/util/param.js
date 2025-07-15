sap.ui.define([
], function () {
    "use strict";

    return {
        changeEventActions: [{
            identification: "Identification",
            champ: "Type",
            action: "onTypeChange"
        }, {
            identification: "Travaux",
            champ: "Mttrvx",
            action: "onCalcTauxTravaux"
        }, {
            identification: "Prix",
            champ: "Mtctr",
            action: "onCalcTauxTravaux"
        }, {
            identification: "Identification",
            champ: "Activity",
            action: "onActivityChange"
        }, {
            identification: "Duree",
            champ: "StartDate",
            action: "onDateChange"
        }, {
            identification: "Duree",
            champ: "EndDate",
            action: "onDateChange"
        }],
        headerFieldChangeEventMapping: {
            "Identification": ["Type", "Activity"],
            "Facturation": [],
            "Client": [],
            "Garantie": [],
            "Contrat": [],
            "Prix": ["Mtctr"],
            "Travaux": ["Mttrvx"],
            "Info": [],
            "Duree": ["NbOfMonth", "RemainingMonth"],
            "Qualite": []
        },
        headerFieldToBeHiddenMapping:
        {
            "create": {
                "Identification": ["BusinessNo", "BusinessStatus"],
                "Facturation": [],
                "Client": [],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": [],
                "Qualite": []
            },
            "modify": {
                "Identification": ["Site", "International"],
                "Facturation": ["plateformDemat", "Modalf", "Rtgart","Reflet", "CurrencyHedging"],
                "Client": ["Siret", "Country"],
                "Garantie": [],
                "Contrat": ["membreGroupement", "Business", "eligibleCir"],
                "Prix": ["nonAcquis", "depenseCommercial"],
                "Travaux": [],
                "Info": [],
                "Duree": [],
                "Qualite": []
            }
        },
        headerFieldToBeUnableMapping: {
            "create": {
                "Identification": ["CompanyCode"],
                "Facturation": [],
                "Client": ["CustomerName", "Scclt", "Siret", "Country"],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
                "Travaux": ["Ingtrvx"],
                "Info": [],
                "Duree": ["NbOfMonth", "RemainingMonth"],
                "Qualite": []
            },
            "modify": {
                "Identification": ["CompanyCode"],
                "Facturation": [],
                "Client": ["CustomerName", "Scclt", "Siret", "Country"],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
                "Travaux": ["Ingtrvx"],
                "Info": [],
                "Duree": ["NbOfMonth", "RemainingMonth"],
                "Qualite": []
            },
        },
        headerSectionToBeHiddenMapping: {
            "create": {
                "sections": [
                    "AfterFacet::ZC_FGASet::GeneralInfo::Section", //Summary Tab 
                    "AfterFacet::ZC_FGASet::TableInfo::Section", //Budget Tab
                    "AfterFacet::ZC_FGASet::Missions::Section", //Missions Tab
                    "template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1" //Graphic Tab
                ]
            },
            "modify": {
                "sections": [
                    "AfterFacet::ZC_FGASet::Missions::Section", //Missions Tab
                ]
            }
        },
        //set mandatory field by affaire type
        headerFieldMandatoryByType: {
            "PO": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "Activity", "Soufam", "PROJM", "Site", "International"],
                "Facturation": ["Modalr", "Avance", "plateformDemat", "Rtgart", "VAT", "Currency"],
                "Client": ["NClient"],
                "Garantie": ["Assurance"],
                "Contrat": ["Mission", "GroupM", "eligibleCir"],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "OI": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "Activity", "Soufam", "PROJM", "Site", "International"],
                "Facturation": ["Modalr", "Avance", "plateformDemat", "Rtgart", "VAT", "Currency", "CurrencyHedging"],
                "Client": ["NClient"],
                "Garantie": ["Assurance"],
                "Contrat": ["Mission", "GroupM", "eligibleCir"],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "RF": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "Activity", "Soufam", "PROJM", "Site", "International"],
                "Facturation": ["VAT", "Currency", "Reflet"],
                "Client": ["NClient"],
                "Garantie": [],
                "Contrat": ["Mission"],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "FG": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "PROJM", "Site", "International"],
                "Facturation": ["VAT", "Currency", "Reflet"],
                "Client": ["NClient"],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "FS": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "Activity", "Soufam", "PROJM", "Site", "International"],
                "Facturation": ["VAT", "Currency", "Reflet"],
                "Client": ["NClient"],
                "Garantie": [],
                "Contrat": ["Mission"],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "OF": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "Activity", "Soufam", "PROJM", "Site", "International"],
                "Facturation": ["VAT", "Currency", "Reflet"],
                "Client": ["NClient"],
                "Garantie": [],
                "Contrat": ["Mission"],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            },
            "PI": {
                "Identification": ["Type", "BusinessName", "UFOName", "CDG", "PROJM", "Site", "International"],
                "Facturation": ["VAT", "Currency"],
                "Client": [],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
                "Travaux": [],
                "Info": [],
                "Duree": ["StartDate", "EndDate"],
                "Qualite": []
            }
        }
    };
});