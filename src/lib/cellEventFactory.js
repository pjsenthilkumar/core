'use strict';

var deprecated = require('./deprecated');
var WritablePoint = require('./WritablePoint');

var writableDescriptor = { writable: true };

// The nullSubgrid is for CellEvents representing clicks below last row.
// var nullSubgrid = {};

var prototype = Object.defineProperties({}, {
    value: {
        get: function() { return this.visibleRow.subgrid.getValue(this.dataCell.x, this.dataCell.y); },
        set: function(value) { this.visibleRow.subgrid.setValue(this.dataCell.x, this.dataCell.y, value); }
    },

    row: {
        get: function() { return this.visibleRow.subgrid.getRow(this.dataCell.y); }
    },

    formattedValue: {
        get: function() { return this.grid.formatValue(this.properties.format, this.value); }
    },

    bounds: { get: function() {
        return this._bounds || (this._bounds = {
            x: this.visibleColumn.left,
            y: this.visibleRow.top,
            width: this.visibleColumn.width,
            height: this.visibleRow.height
        });
    } },

    columnProperties: { get: function() {
        var cp = this._columnProperties;
        if (!cp) {
            cp = this.column.properties;
            if (this.isHandleColumn || this.isHierarchyColumn) {
                cp = cp.rowHeader;
            } else if (this.isDataRow) {
                // cp already set to basic props
            } else if (this.isFilterRow) {
                cp = cp.filterProperties;
            } else if (this.isInfoRow) {
                cp = cp.infoProperties;
            } else { // unselected header, summary, etc., all have save look as unselected header
                cp = cp.columnHeader;
            }
            this._columnProperties = cp;
        }
        return cp;
    } },
    cellOwnProperties: { get: function() { // do not use for get/set prop because may return null; instead use  .getCellProperty('prop') or .properties.prop (preferred) to get and setCellProperty('prop', value) to set
        if (this._cellOwnProperties === undefined) {
            this._cellOwnProperties = this.column.getCellOwnProperties(this.dataCell.y, this.visibleRow.subgrid);
        }
        return this._cellOwnProperties; // null return means there is no cell properties object
    } },
    properties: { get: function() {
        return this.cellOwnProperties || this.columnProperties;
    } },
    getCellProperty: { value: function(key) { // included for completeness but .properties[key] is preferred
        return this.properties[key];
    } },
    setCellProperty: { value: function(key, value) { // do not use .cellOwnProperties[key] = value because object may be null (this method creates object as needed)
        this._cellOwnProperties = this.column.setCellProperty(this.dataCell.y, key, value, this.visibleRow.subgrid);
    } },

    // special methods for use by renderer which reuses cellEvent object for performance reasons
    reset: { value: function(visibleColumn, visibleRow) {
        // getter caches
        this._columnProperties = undefined;
        this._cellOwnProperties = undefined;
        this._bounds = undefined;

        // partial render support
        this.snapshot = undefined;
        this.minWidth = undefined;
        this.disabled = undefined;

        this.visibleColumn = visibleColumn;
        this.visibleRow = visibleRow;

        this.column = visibleColumn.column; // enumerable so will be copied to cell renderer object

        this.gridCell.x = visibleColumn.columnIndex;
        this.gridCell.y = visibleRow.index;

        this.dataCell.x = this.column && this.column.index;
        this.dataCell.y = visibleRow.rowIndex;
    } },

    subgrid: { get: function() { return this.visibleRow.subgrid; } },

    // "Visible" means scrolled into view.
    isRowVisible:    { get: function() { return !!this.visibleRow; } },
    isColumnVisible: { get: function() { return !!this.visibleColumn; } },
    isCellVisible:   { get: function() { return this.isRowVisible && this.isColumnVisible; } },

    isDataRow:    { get: function() { return this.visibleRow.subgrid.isData; } },
    isDataColumn: { get: function() { return this.gridCell.x >= 0; } },
    isDataCell:   { get: function() { return this.isDataRow && this.isDataColumn; } },

    isRowSelected:    { get: function() { return this.isDataRow && this.selectionModel.isRowSelected(this.dataCell.y); } },
    isColumnSelected: { get: function() { return this.isDataColumn && this.selectionModel.isColumnSelected(this.gridCell.x); } },
    isCellSelected:   { get: function() { return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y); } },

    isRowHovered:    { get: function() { return this.isDataRow && this.grid.hoverCell && this.grid.hoverCell.y === this.gridCell.y; } },
    isColumnHovered: { get: function() { return this.isDataColumn && this.grid.hoverCell && this.grid.hoverCell.x === this.gridCell.x; } },
    isCellHovered:   { get: function() { return this.isRowHovered && this.isColumnHovered; } },

    isRowFixed:    { get: function() { return this.isDataRow && this.dataCell.y < this.grid.properties.fixedRowCount; } },
    isColumnFixed: { get: function() { return this.isDataColumn && this.gridCell.x < this.grid.properties.fixedColumnCount; } },
    isCellFixed:   { get: function() { return this.isRowFixed && this.isColumnFixed; } },

    isHandleColumn: { get: function() { return !this.isDataColumn; } },
    isHandleCell:   { get: function() { return this.isHandleColumn && this.isDataRow; } },

    isHierarchyColumn: { get: function() { return this.gridCell.x === 0 && this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(this.dataCell.x); } },

    isInfoRow:      { get: function() { return this.visibleRow.subgrid.isInfo; } },

    isHeaderRow:    { get: function() { return this.visibleRow.subgrid.isHeader; } },
    isHeaderHandle: { get: function() { return this.isHeaderRow && this.isHandleColumn; } },
    isHeaderCell:   { get: function() { return this.isHeaderRow && this.isDataColumn; } },

    isFilterRow:    { get: function() { return this.visibleRow.subgrid.isFilter; } },
    isFilterHandle: { get: function() { return this.isFilterRow && this.isHandleColumn; } },
    isFilterCell:   { get: function() { return this.isFilterRow && this.isDataColumn; } },

    isSummaryRow:    { get: function() { return this.visibleRow.subgrid.isSummary; } },
    isSummaryHandle: { get: function() { return this.isSummaryRow && this.isHandleColumn; } },
    isSummaryCell:   { get: function() { return this.isSummaryRow && this.isDataColumn; } },

    isTopTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.lookup.topTotals; } },
    isTopTotalsHandle: { get: function() { return this.isTopTotalsRow && this.isHandleColumn; } },
    isTopTotalsCell:   { get: function() { return this.isTopTotalsRow && this.isDataColumn; } },

    isBottomTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.lookup.bottomTotals; } },
    isBottomTotalsHandle: { get: function() { return this.isBottomTotalsRow && this.isHandleColumn; } },
    isBottomTotalsCell:   { get: function() { return this.isBottomTotalsRow && this.isDataColumn; } },

    $$CLASS_NAME: { value: 'CellEvent' },
    deprecated: { value: deprecated },

    isGridRow: { get: function() {
        this.deprecated('isGridRow', '.isGridRow is deprecated as of v1.2.10 in favor of .isDataRow. (Will be removed in a future release.)');
        return this.isDataRow;
    } },
    isGridColumn: { get: function() {
        this.deprecated('isGridColumn', '.isGridColumn is deprecated as of v1.2.10 in favor of .isDataColumn. (Will be removed in a future release.)');
        return this.isDataColumn;
    } },
    isGridCell: { get: function() {
        this.deprecated('isGridCell', '.isGridCell is deprecated as of v1.2.10 in favor of .isDataCell. (Will be removed in a future release.)');
        return this.isDataCell;
    } },
});

/**
 * @classdesc `CellEvent` is a very low-level object that needs to be super-efficient. JavaScript objects are well known to be light weight in general, but at this level we need to be careful.
 *
 * These objects were originally only being created on mouse events. This was no big deal as mouse events are few and far between. However, as of v1.2.0, the renderer now also creates one for each visible cell on each and every grid paint.
 *
 * For this reason, to maintain performance, each grid gets a custom definition of `CellEvent`, created by this class factory, with the following optimizations:
 *
 * * Use of `extend-me` is avoided because its `initialize` chain is a bit too heavy here.
 * * Custom versions of `CellEvent` for each grid lightens the load on the constructor.
 *
 * @summary Create a custom `CellEvent` class.
 *
 * @desc Create a custom definition of `CellEvent` for each grid instance, setting the `grid`, `behavior`, and `dataModel` properties on the prototype. As this happens once per grid instantiation, it avoids having to perform this set up work on every `CellEvent` instantiation.
 *
 * @param {HyperGrid} grid
 *
 * @returns {CellEvent}
 */
function factory(grid) {

    /**
     * @summary Create a new CellEvent object.
     * @desc All own enumerable properties are mixed into cell editor:
     * * Includes `this.column` defined by constructor (as enumerable).
     * * Excludes `this.gridCell`, `this.dataCell`, `this.visibleRow.subgrid` defined by constructor (as non-enumerable).
     * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
     *
     * Omit params to defer `reset`.
     * @param {number} [x] - grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param {number} [y] - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     * @param {boolean} [isDataRow=false]
     * @constructor
     */
    function CellEvent(x, y, isDataRow) {
        // remaining instance vars are non-enumerable so `CellEditor` constructor won't mix them in (for mustache use).
        Object.defineProperties(this, {
            /**
             * @name visibleColumn
             * @type {visibleColumnDescriptor}
             * @memberOf CellEvent#
             */
            visibleColumn: writableDescriptor,

            /**
             * @name visibleRow
             * @type {visibleRowDescriptor}
             * @memberOf CellEvent#
             */
            visibleRow: writableDescriptor,

            /**
             * @name gridCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            gridCell: {
                value: new WritablePoint
            },

            /**
             * @name dataCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            dataCell: {
                value: new WritablePoint
            },

            column: writableDescriptor,

            // getter caches
            _columnProperties: writableDescriptor,
            _cellOwnProperties: writableDescriptor,
            _bounds: writableDescriptor,

            // Following supports cell renderers' "partial render" capability:
            snapshot: writableDescriptor,
            minWidth: writableDescriptor,
            disabled: writableDescriptor
        });

        if (arguments.length) {
            this.reset(
                this.grid.renderer.visibleColumns.find(function(vc) { return vc.columnIndex === x; }),
                isDataRow
                    ? this.grid.renderer.visibleRows.find(function(vr) { return vr.rowIndex === y; })
                    : this.grid.renderer.visibleRows[y]
            );
        }
    }

    CellEvent.prototype = Object.create(prototype);

    Object.defineProperties(CellEvent.prototype, {
        constructor: { value: CellEvent },
        grid: { value: grid },
        renderer: { value: grid.renderer },
        selectionModel: { value: grid.selectionModel },
        behavior: { value: grid.behavior },
        dataModel: { value: grid.behavior.dataModel }
    });

    return CellEvent;
}

module.exports = factory;
