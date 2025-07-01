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
                identifiant: "Facturation",
                field: "paysFacture"
            }, {
                identifiant: "Client",
                field: "isFrance"
            }
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
                "Identification": ["BusinessNo", "BusinessName", "CDG", "UFOName", "Activity", "Soufam", "Type", "Rgfact", "PROJM", "Project_lib", "Site", "International"],
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
            "Identification": ["BusinessNo", "BusinessName", "CDG", "UFOName", "Activity", "Soufam", "Type", "Rgfact", "PROJM", "Project_lib", "Site", "International"],
            "Facturation": ["Modalr", "Modalf", "Avance", "plateformDemat", "Chorus", "Rtgart", "VAT", "Currency", "contactFacture", "mailFacture", "libelleFacture", "adresseFacture", "paysFacture"],
            "Client": ["NClient", "CustomerName", "Scclt", "Interlocuteur", "Fonction", "Telephone", "Email", "isFrance", "Siret", "otherIdentification"],
            "Garantie": ["CautGA", "Assurance"],
            "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
            "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
            "Travaux": ["Mttrvx", "Ingtrvx"],
            "Info": ["Period"],
            "Duree": ["StartDate", "EndDate"],
            "Qualite": ["UrlCup"],
        },

    };
});