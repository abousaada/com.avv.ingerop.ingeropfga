sap.ui.define([
], function () {
    "use strict";

    return {
        defaultMission: {
            MissionsCode: null,
            StartDate: null,
            EndDate: null,
            ExternalRevenue: 0.00,
            LaborBudget: 0.00,
            // Subcontracting: 0.00,
            // OtherCosts: 0.00
        },
        //only for modification, hide listed fields
        headerFieldToBeHiddenMapping: [
            {
                identifiant: "Identification",
                field: "PROJM"
            },
            {
                identifiant: "Identification",
                field: "Project_lib"
            },
            {
                identifiant: "Identification",
                field: "Site"
            },
            {
                identifiant: "Identification",
                field: "International"
            },
            {
                identifiant: "Facturation",
                field: "paysFacture"
            }, 
            {
                identifiant: "Facturation",
                field: "plateformDemat"
            }, 
            {
                identifiant: "Facturation",
                field: "contactFacture"
            }, 
            {
                identifiant: "Facturation",
                field: "mailFacture"
            }, 
            {
                identifiant: "Facturation",
                field: "libelleFacture"
            },
            {
                identifiant: "Facturation",
                field: "adresseFacture"
            }, 
            {
                identifiant: "Facturation",
                field: "Modalf"
            }, 
            {
                identifiant: "Client",
                field: "isFrance"
            },
            {
                identifiant: "Client",
                field: "Interlocuteur"
            },
            {
                identifiant: "Client",
                field: "Siret"
            },
            {
                identifiant: "Client",
                field: "Fonction"
            },
            {
                identifiant: "Client",
                field: "Telephone"
            },
            {
                identifiant: "Client",
                field: "Email"
            }, 
            {
                identifiant: "Client",
                field: "otherIdentification"
            },
            {
                identifiant: "Garantie",
                field: "CautGA"
            },
            {
                identifiant: "Contrat",
                field: "membreGroupement"
            },
            {
                identifiant: "Contrat",
                field: "projetAgora"
            },
            {
                identifiant: "Contrat",
                field: "voletEcologie"
            },
            {
                identifiant: "Contrat",
                field: "Business"
            },
            {
                identifiant: "Contrat",
                field: "eligibleCir"
            },
            {
                identifiant: "Contrat",
                field: "projetCup"
            },
            {
                identifiant: "Prix",
                field: "nonAcquis"
            },
            {
                identifiant: "Prix",
                field: "depenseCommercial"
            },
        ],
        //only for creation, hide listed sections
        headerSectionToBeHiddenMapping: [
            "AfterFacet::ZC_FGASet::GeneralInfo::Section", //Summary Tab 
            "AfterFacet::ZC_FGASet::TableInfo::Section", //Budget Tab
            "AfterFacet::ZC_FGASet::Missions::Section", //Missions Tab
            "template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1" //Graphic Tab
        ],
        //set mandatory field by affaire type
        headerFieldMandatoryByType: {
            "PO": {
                "Identification": ["BusinessName", "CDG", "UFOName", "Activity", "Soufam", "Type", "Rgfact", "PROJM", "Project_lib", "Site", "International"],
                "Facturation": ["Modalr", "Modalf", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "contactFacture", "mailFacture", "libelleFacture", "adresseFacture", "paysFacture"],
                "Client": ["NClient", "CustomerName", "Scclt", "Interlocuteur", "isFrance", "Siret"],
                "Contrat": ["Mission", "GroupM", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
                "Duree": ["StartDate", "EndDate"]
            },
            "OI": {
               "Facturation": ["Modalr", "Modalf", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "contactFacture", "mailFacture", "libelleFacture", "adresseFacture", "paysFacture"],
            },
            "RF": {},
            "FG": {},
            "FS": {},
            "OF": {},
            "PI": {}
        },
        //All header fields
        headerFieldsList: {
            "Identification": ["BusinessNo", "Type", "BusinessName", "UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
            "Facturation": ["Modalr", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging", "exchangeRateHedging"],
            "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
            "Garantie": ["Assurance"],
            "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
            "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
            "Travaux": ["Mttrvx", "Ingtrvx"],
            "Info": ["Period"],
            "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
            "Qualite": ["UrlCup"],
        },

    };
});