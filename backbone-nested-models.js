/**
 * Backbone Nested Models
 * Author: Bret Little
 * Version: 1.0.0
 *
 * Nested model support in Backbone.js
 *
 **/

// support amd and common js
(function (root, factory) {
  if (typeof exports === 'object') {
		// CommonJS
		module.exports = factory(require('backbone'), require('underscore'));
	} else if (typeof define === 'function' && define.amd) {
		// AMD
		define(['backbone', 'underscore'], function (b, u) {
			return (root.returnExportsGlobal = factory(b, u));
		});
	} else {
		// Global Variables
		root.returnExportsGlobal = factory(root.Backbone, root._);
	}
}(this, function (Backbone, _) {

    var Model = Backbone.Model,
        Collection = Backbone.Collection,
        originalSet = Backbone.Model.prototype.set;

    Backbone.Model.prototype.setRelation = function(attr, val, options) {
        var relation = this.attributes[attr],
            id = this.idAttribute || "id",
            modelToSet, modelsToAdd = [], modelsToRemove = [];

        if(options.unset && relation) delete relation.parent;

        if(this.relations && _.has(this.relations, attr)) {

            // If the relation already exists, we don't want to replace it, rather
            // update the data within it whether it is a collection or model
            if(relation && relation instanceof Collection) {

                // `val` can come in as a Collection, Array, or single Model.
                // Ensure that it is an Array for use with `collection.set()`.
                if(val instanceof Collection || val instanceof Array) {
                    val = val.models || val;
                } else {
                    val = [val];
                }

                relation.set(val, options);

                return relation;
            }

            if(relation && relation instanceof Model) {

                // `val` can come in as a Model or attributes hash.
                // Ensure that it is an attributes hash for use with `model.set()`.
                if (val instanceof Model) {
                    val = val.toJSON()
                }

                relation.set(val, options);

                return relation;
            }

            options._parent = this;

            if (!(val instanceof Collection)) {
                val = new this.relations[attr](val, options);
            }
            val.parent = this;
        }

        return val;
    };

    Backbone.Model.prototype.set = function(key, val, options) {
        //Calling setRelation, not using the return value.
        this.setRelation.apply(this, arguements);
        
        //Calling the original set.
        return originalSet.apply(this, arguements);
    };

    Backbone.Model.prototype.toJSON = function(options) {
      var attrs = _.clone(this.attributes);

      _.each(this.relations, function(rel, key) {
        if (_.has(attrs, key)) {
          attrs[key] = attrs[key].toJSON();
        } else {
            attrs[key] = (new rel()).toJSON();
        }
      });

      return attrs;
    };

    Backbone.Model.prototype.clone = function(options) {
        return new this.constructor(this.toJSON());
    };

    Backbone.Collection.prototype.resetRelations = function(options) {
        _.each(this.models, function(model) {
            _.each(model.relations, function(rel, key) {
                if(model.get(key) instanceof Backbone.Collection) {
                    model.get(key).trigger('reset', model, options);
                }
            });
        })
    };

    Backbone.Collection.prototype.reset = function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) {
        this.trigger('reset', this, options);
        this.resetRelations(options);
      }
      return this;
    };

    return Backbone;
}));
