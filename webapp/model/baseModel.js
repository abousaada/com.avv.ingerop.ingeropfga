sap.ui.define([
    "sap/ui/model/json/JSONModel",
],
    function (JSONModel) {
        "use strict";

        return JSONModel.extend("com.avv.ingerop.ingeropfga.model.baseModel", {

            constructor: function (data) {
                // Appeler le constructeur parent
                JSONModel.call(this, data);

                // Générer dynamiquement les méthodes pour les données initiales
                this._generateDynamicMethods(data, "", "");
            },

            // Surcharge de la méthode setData
            setData: function (data, bMerge) {
                // Appeler la méthode parent pour définir les données
                JSONModel.prototype.setData.call(this, data, bMerge);

                // Générer dynamiquement les méthodes pour les nouvelles données
                this._generateDynamicMethods(data, "", "");
            },

            initModel(oModel) {
                this.oModel = oModel;
            },

            //Odata V2 RESP API Call function examples

            async create(entity, data, options={}){
                return new Promise((resolve, reject) => 
                    this.oModel.create(entity, data, {
                        ...options,
                        success:function(odata){ resolve(odata); },
                        error:function(oError){ reject(oError); }
                    })
                );
            },

            async read(entity, options={} ){
                return new Promise((resolve, reject) => 
                    this.oModel.read(entity, {
                        ...options,
                        success:function(odata){ resolve(odata); },
                        error:function(oError){ reject(oError); }
                    })
                );
            },

            async update(entity, data, options={} ) {
                return new Promise((resolve, reject) => 
                    this.oModel.update(entity, data, {
                        ...options,
                        success:function(odata){ resolve(odata); },
                        error:function(oError){ reject(oError); }
                    })
                );
            },

            //odata v4 RESP API Call function examples

            /*

            initModel(oModel) {
                this.oModel = oModel;
            },

            async getData(sPath, aFilters = [], oParameters = {}) {
                let oBindList = this.oModel.bindList(sPath, undefined, undefined, aFilters, oParameters);
                return oBindList.requestContexts();
            },

            async create(sPath, oData) {
                let oBindList = this.oModel.bindList(sPath);
                const createdContext = oBindList.create(oData);
                const res = await createdContext.created();
                return createdContext;
            },

            update(sPath, aFilters, aValuesMap) {
                let oBindList = this.oModel.bindList(sPath);
                oBindList.filter(aFilters).requestContexts().then(function (aContexts) {
                    aValuesMap.map((key, value) => {
                        aContexts[0].setProperty(key, value);
                    });
                });
            },

            delete(sPath, aFilters) {
                let oBindList = this.oModel.bindList(sPath);
                oBindList.filter(aFilters).requestContexts().then(function (aContexts) {
                    aContexts[0].delete();
                });
            },

            async sendDataToBackEnd() {
                const oModel = this.oModel;
                const groupeID = oModel.getGroupId();
                return oModel.submitBatch(groupeID);
            },

            async refreshBackDataByContext(oContext) {
                try {
                    const hasSendData = await this.sendDataToBackEnd();
                    const refresh = await oContext.refresh();
                } catch (error) {
                    console.error("Erreur lors du rafraîchissement des données de contexte :", error);
                }
            },

            callFunction(sPath) {
                let oBindList = this.oModel.bindContext(sPath, null, {});
                return new Promise((resolve, reject) => oBindList.requestObject().then(resolve, reject));
            },

            */

            // Méthode privée pour générer dynamiquement les getters et setters
            _generateDynamicMethods: function (data, pathPrefix, keyPrefix) {
                if (!data || typeof data !== "object") {
                    return; // Ne rien faire si les données ne sont pas un objet
                }

                // Parcourir les propriétés de l'objet
                Object.keys(data).forEach((key) => {
                    const fullPath = `${pathPrefix}/${key}`.replace(/\/\//g, "/"); // Construire le chemin complet
                    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    const fullkey = `${keyPrefix}${capitalizedKey}`.replace(/\/\//g, "")

                    // Si la propriété est une Date, ne pas traiter récursivement
                    if (data[key] instanceof Date) {
                        // Créer une méthode getter pour accéder à la date
                        this[`get${fullkey}`] = function () {
                            return this.getProperty(fullPath);
                        };

                        // Créer une méthode setter pour définir la date
                        this[`set${fullkey}`] = function (value) {
                            if (!(value instanceof Date)) {
                                throw new Error(`Invalid value for ${key}. Expected a Date object.`);
                            }
                            console.log(fullPath + " : " + value);
                            this.setProperty(fullPath, value);
                        };
                        return;
                    }

                    // Créer une méthode getter pour accéder à la propriété complète
                    this[`get${fullkey}`] = function () {
                        return this.getProperty(fullPath);
                    };

                    // Créer une méthode setter pour définir la propriété complète
                    this[`set${fullkey}`] = function (value) {
                        this.setProperty(fullPath, value);
                        console.log(this.getMetadata().getName() + " => " + fullPath + ":", value);
                    };

                    // Si la propriété est un tableau, ne pas traiter récursivement
                    if (Array.isArray(data[key])) {
                        return; // Ne pas parcourir les éléments du tableau
                    }

                    // Si la propriété est un objet, traiter récursivement
                    if (typeof data[key] === "object" && data[key] !== null) {
                        this._generateDynamicMethods(data[key], fullPath, fullkey);
                    }
                });
            },

            // Attach table to model
            /*

            setTable: function (oTable) {
                this.oTable = oTable;
            },

            getTable: function () {
                return this.oTable;
            },

            getSelectedTableLines: function () {
                const oTable = this.getTable();
                return oTable
                    .getSelectedIndices()
                    .map(indice => oTable.getContextByIndex(indice)?.getObject());
            },

            getSelectedTableLinesByContext() {
                const oTable = this.getTable();
                return oTable
                    .getSelectedIndices()
                    .map(indice => oTable.getContextByIndex(indice));
            },

            getSelectedTableLength() {
                return this.getTable().getSelectedIndices().length;
            },

            getTableLength(){
                return this.getTable()._iBindingLength;
            },

            */

            // async callAPI(type, url, headers, data) {
            //     return new Promise(
            //         (success, error) => { 
            //             $.ajax({ type, url, headers, async: false, 
            //                 data: data ? JSON.stringify(data) : null, 
            //                 contentType: "application/json",
            //                 success,
            //                 error
            //             });
            //         }
            //     );
            // },
        });
    });
