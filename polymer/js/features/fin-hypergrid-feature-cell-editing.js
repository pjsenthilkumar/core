'use strict';
/**
 *
 * @module features\cell-editing
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleDoubleClick: function(grid, event) {
            var fixedColCount = grid.getFixedColumnCount();
            var fixedRowCount = grid.getFixedRowCount();
            var gridCell = event.gridCell;
            if (gridCell.x >= fixedColCount && gridCell.y >= fixedRowCount) {
                var x = grid.getHScrollValue() + gridCell.x - fixedColCount;
                var y = grid.getVScrollValue() + gridCell.y - fixedRowCount;
                event.gridCell = grid.rectangles.point.create(x, y);
                grid._activateEditor(event);
            } else if (this.next) {
                this.next.handleDoubleClick(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleHoldPulse: function(grid, mouseEvent) {
            var primEvent = mouseEvent.primitiveEvent;
            if (primEvent.detail.count < 2) {
                return;
            }
            grid._activateEditor(mouseEvent);
        },
    });

})(); /* jshint ignore:line */
