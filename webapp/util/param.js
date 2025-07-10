sap.ui.define([
], function () {
    "use strict";

    return {
        headerFieldToBeHiddenMapping:
        {
            "create": {
                "Identification": ["Site", "International"],
                "Facturation": ["plateformDemat", "Modalf"],
                "Client": ["Siret"],
                "Garantie": [],
                "Contrat": ["membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                "Prix": ["nonAcquis", "depenseCommercial"],
                "Travaux": [],
                "Info": [],
                "Duree": [],
                "Qualite": []
            },
            "modify": {
                "Identification": [],
                "Facturation": [],
                "Client": [],
                "Garantie": [],
                "Contrat": [],
                "Prix": [],
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
        //only for creation, hide listed sections
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
                "Identification": ["BusinessName", "CDG", "UFOName", "Activity", "Soufam", "Type", "Rgfact", "PROJM", "Project_lib", "Site", "International"],
                "Facturation": ["Modalr", "Modalf", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "contactFacture", "mailFacture", "libelleFacture", "adresseFacture", "paysFacture"],
                "Client": ["NClient", "CustomerName", "Scclt", "Interlocuteur", "isFrance", "Siret"],
                // "Garantie": ["Assurance"],
                "Contrat": ["Mission", "GroupM", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                "Duree": ["StartDate", "EndDate"],
                // "Travaux": ["Mttrvx", "Ingtrvx"]
                // "Qualite": ["UrlCup"]
            },
            "OI": {
                "Facturation": ["Modalr", "Modalf", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "contactFacture", "mailFacture", "libelleFacture", "adresseFacture", "paysFacture"],
            },
            "RF": {
                // "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
                // "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
                // "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
                // "Garantie": ["Assurance"],
                // "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                // "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
                // "Qualite": ["UrlCup"]
            },
            "FG": {
                // "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
                // "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
                // "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
                // "Garantie": ["Assurance"],
                // "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                // "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
                // "Qualite": ["UrlCup"]
            },
            "FS": {
                // "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
                // "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
                // "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
                // "Garantie": ["Assurance"],
                // "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                // "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
                // "Qualite": ["UrlCup"]
            },
            "OF": {
                // "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
                // "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
                // "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
                // "Garantie": ["Assurance"],
                // "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                // "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
                // "Qualite": ["UrlCup"]
            },
            "PI": {
                // "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
                // "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
                // "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
                // "Garantie": ["Assurance"],
                // "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                // "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
                // "Travaux": ["Mttrvx", "Ingtrvx"],
                // "Info": ["Period"],
                // "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
                // "Qualite": ["UrlCup"]
            }
        }
    };
});