import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    StudyList.callbacks['dblClickOnStudy'] = dblClickOnStudy;
    StudyList.callbacks['middleClickOnStudy'] = dblClickOnStudy;

    StudyList.timepointApi = new OHIF.measurements.TimepointApi();
    StudyList.timepointApi.retrieveTimepoints();
});

/**
 * Lesion Tracker method including Timepoints / other studies
 */
function dblClickOnStudy(data) {
    // Use the formatPN template helper to clean up the patient name
    let title = formatPN(data.patientName);

    const instance = Template.instance();

    // Find the relevant timepoint given the clicked-on study
    const timepointApi = StudyList.timepointApi;
    if (!timepointApi) {
        console.log('No timepoint api on dbl-clicked study?');
        return;
    }

    const timepoint = timepointApi.study(data.studyInstanceUid)[0];
    if (timepoint) {
        // Add the Timepoint name to the Patient name to create the tab title
        title += ' ' + timepointApi.name(timepoint);
        OHIF.lesiontracker.openNewTabWithTimepoint(timepoint.timepointId, title);
    } else {
        open(data.studyInstanceUid, title);
    }
}

/**
 * Opens a study
 *
 * @param studyInstanceUid The UID of the Study to be opened
 * @param title The title to be used for the tab heading
 */
function open(studyInstanceUid, title) {
    const contentid = 'viewerTab';

    ViewerData = window.ViewerData || ViewerData;

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        isUnassociatedStudy: true,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    switchToTab(contentid);
}
