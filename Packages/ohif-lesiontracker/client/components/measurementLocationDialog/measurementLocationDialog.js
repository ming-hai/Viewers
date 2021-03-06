// Note: This component is not in use, but the functions below are still being used. This
// is in the process of being moved into another location
import { OHIF } from 'meteor/ohif:core';

// This event sets measurement number for new measurement
function getSetMeasurementNumberCallbackFunction(measurementTypeId, measurementApi, timepointApi) {
    return (measurementData, eventData, doneCallback) => {
        // Get the current element's timepointId from the study date metadata
        var element = eventData.element;
        var enabledElement = cornerstone.getEnabledElement(element);
        var imageId = enabledElement.image.imageId;

        var study = cornerstoneTools.metaData.get('study', imageId);
        if (!timepointApi) {
            return;
        }

        // Find the relevant timepoint given the current study
        var timepoint = timepointApi.study(study.studyInstanceUid)[0];
        if (!timepoint) {
            return;
        }

        // Get a measurement number for this measurement, depending on whether or not the same measurement previously
        // exists at a different timepoint
        const timepointId = timepoint.timepointId;
        const collection = measurementApi[measurementTypeId];
        const measurementNumber = OHIF.measurements.MeasurementManager.getNewMeasurementNumber(timepointId, collection, timepointApi);
        measurementData.measurementNumber = measurementNumber;

        // Set measurement number
        doneCallback(measurementNumber);
    };
}

Template.measurementLocationDialog.onCreated(() => {
    const instance = Template.instance();
    const measurementTypeId = 'targets';
    const measurementApi = instance.data.measurementApi;
    const timepointApi = instance.data.timepointApi;

    const toggleLabel = (measurementData, eventData, doneCallback) => {
        delete measurementData.isCreating;

        if (OHIF.lesiontracker.removeMeasurementIfInvalid(measurementData, eventData)) {
            return;
        }

        const getHandlePosition = key => _.pick(measurementData.handles[key], ['x', 'y']);
        const start = getHandlePosition('start');
        const end = getHandlePosition('end');
        const getDirection = axis => start[axis] < end[axis] ? 1 : -1;
        const position = OHIF.cornerstone.pixelToPage(eventData.element, end);

        OHIF.measurements.toggleLabelButton({
            instance,
            measurementId: measurementData._id,
            toolType: measurementData.toolType,
            element: eventData.element,
            measurementApi: instance.data.measurementApi,
            position: position,
            direction: {
                x: getDirection('x'),
                y: getDirection('y')
            }
        });
    };

    const callbackConfig = {
        setMeasurementNumberCallback: getSetMeasurementNumberCallbackFunction(measurementTypeId, measurementApi, timepointApi),
        // TODO: Check the position for these, the Add Label button position seems very awkward
        getMeasurementLocationCallback: toggleLabel,
        changeMeasurementLocationCallback: toggleLabel,
    };


    // TODO: Reconcile this with the configuration in toolManager
    // it would be better to have this all in one place.
    const bidirectionalConfig = cornerstoneTools.bidirectional.getConfiguration();
    const config = {
        ...bidirectionalConfig,
        ...callbackConfig
    };

    cornerstoneTools.bidirectional.setConfiguration(config);

    // Set CR-Tool, UN-Tool, EX-Tool configurations
    cornerstoneTools.crTool.setConfiguration(config);
    cornerstoneTools.exTool.setConfiguration(config);
    cornerstoneTools.unTool.setConfiguration(config);

});

// Note: None of these events work anymore
Template.measurementLocationDialog.events({
    'click #removeMeasurement': function() {
        var measurementData = Template.measurementLocationDialog.measurementData;
        var doneCallback = Template.measurementLocationDialog.doneCallback;
        var dialog = Template.measurementLocationDialog.dialog;

        var options = {
            keyPressAllowed: false,
            title: 'Remove measurement?',
            text: 'Are you sure you would like to remove the entire measurement?'
        };

        showConfirmDialog(function() {
            if (doneCallback && typeof doneCallback === 'function') {
                var deleteTool = true;
                doneCallback(measurementData, deleteTool);
            }
        }, options);

        closeHandler(dialog);
    },
    'click #convertToNonTarget': function() {
        var measurementData = Template.measurementLocationDialog.measurementData;
        var dialog = Template.measurementLocationDialog.dialog;

        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        OHIF.measurementTracker.convertToNonTarget(measurementApi, measurementData);

        closeHandler(dialog);
    }
});
