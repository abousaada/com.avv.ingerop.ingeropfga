sap.ui.define([
], function () {
    "use strict";

    return {
        types: ["PO", "OI", "RF", "FG", "FS", "OF", "PI", "Z0", "Z1","PC" ],
        defaultMission: {
            MissionsCode: null,
            StartDate: null,
            EndDate: null,
            ExternalRevenue: 0.00,
            LaborBudget: 0.00,
            // Subcontracting: 0.00,
            // OtherCosts: 0.00
        },
        defaultBudget:[
            {
                MissionId : "",
                BusinessNo : "",
                MissionCode : "",
                Libelle : "",
                Statut : "",
                StartDate : "",
                EndDate : "",
                Regroupement : "",
                _BudgetPxSubContractor : [

                ],
            },
            {
                MissionId : "",
                BusinessNo : "",
                MissionCode : "",
                Libelle : "",
                Statut : "",
                StartDate : "",
                EndDate : "",
                Regroupement : "",
                _BudgetPxSubContractor : [
                    
                ],
            },
            {
                MissionId : "",
                BusinessNo : "",
                MissionCode : "",
                Libelle : "",
                Statut : "",
                StartDate : "",
                EndDate : "",
                Regroupement : "",
                _BudgetPxSubContractor : [
                    
                ],
            },
            {
                MissionId : "",
                BusinessNo : "",
                MissionCode : "",
                Libelle : "",
                Statut : "",
                StartDate : "",
                EndDate : "",
                Regroupement : "",
                _BudgetPxSubContractor : [
                    
                ],
            }
        ]
    };
});