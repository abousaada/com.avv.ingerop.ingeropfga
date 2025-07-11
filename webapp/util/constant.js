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
        //All header fields
        headerFieldsList: {
            "Identification": ["BusinessNo", "Type", "BusinessName", "BusinessStatus","UFOName", "CDG", "CompanyCode", "Activity", "Soufam", "PROJM", "Site", "International", "Rgfact"],
            "Facturation": ["Modalr", "Avance", "plateformDemat", "Rtgart", "VAT", "Currency", "Reflet", "CurrencyHedging"],
            "Client": ["NClient", "CustomerName", "Scclt", "Siret", "Country"],
            "Garantie": ["Assurance"],
            "Contrat": ["Mission", "GroupM", "Mandata", "membreGroupement", "projetAgora", "voletEcologie", "Business", "eligibleCir", "projetCup"],
            "Prix": ["Mtctr", "nonAcquis", "Paring", "depenseCommercial"],
            "Travaux": ["Mttrvx", "Ingtrvx"],
            "Info": ["Period"],
            "Duree": ["StartDate", "EndDate", "NbOfMonth", "RemainingMonth"],
            "Qualite": ["UrlCup"]
        },
        //All Section except header fields Section
        headerSectionList: [
            "AfterFacet::ZC_FGASet::GeneralInfo::Section", //Summary Tab 
            "AfterFacet::ZC_FGASet::TableInfo::Section", //Budget Tab
            "AfterFacet::ZC_FGASet::Missions::Section", //Missions Tab
            "template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::GeneralInfo:::sEntitySet::ZC_FGASet:::sFacetExtensionKey::1" //Graphic Tab
        ]

    };
});