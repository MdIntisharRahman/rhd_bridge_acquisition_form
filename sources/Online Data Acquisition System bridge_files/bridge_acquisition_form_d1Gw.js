$.validator.setDefaults({
	submitHandler: function() {
		form_submit();
	}
});
var show_option_for_river = function(){
    var val = $('#acquisitionTypeOfRiver').val();
    if(val == 'Tidal'){
        $('.tidalDiv').find(':input').prop('disabled',false);
        $('.tidalDiv').slideDown();
    }else{
        $('.tidalDiv').find(':input').prop('disabled',true);
        $('.tidalDiv').slideUp();
    }
}
var show_bridge_design_user = function(){
    var val = $('#acquisitionFormStatus').val();
    if(val == 'Send To Bridge Division'){
        $('#acquisitionBridgeApprovedBy').prop('disabled',false);
    }else{
        $('#acquisitionBridgeApprovedBy').prop('disabled',true);
    }
}
$().ready(function() {
    $('[data-tooltip="tooltip"]').tooltip();
    
    $("#sampleForm").validate({
        rules: {
            acquisitionStandardHighWaterLevel: {
                required: true,
                max: function(){ 
                    return $("#acquisitionHighestFloodLevel").val();
                }
            },
            /*acquisitionLowestWaterLevel: {
                required: true,
                max: function(){ 
                    return $("#acquisitionStandardHighWaterLevel").val();
                }
            },*/
            /*acquisitionWaterLevelAtTheTimeOfSurvey: {
                required: true,
                min: function(){ 
                    return $("#acquisitionLowestWaterLevel").val();
                },
                max: function(){ 
                    return $("#acquisitionHighestFloodLevel").val();
                }
            },*/
            acquisitionBottomRLOfMidSpan: {
                required: true,
                minimum: function(){ 
                    return $("#acquisitionHighestFloodLevel").val();
                }
            },
        },
        errorPlacement: function(error, element) {
            if (element.attr("name") == "acquisitionNavigationalClearanceValue" ){
                error.appendTo("#acquisitionNavigationalClearanceValue-error");
            }else{
                error.insertAfter(element);
            }
        }
    });
    show_option_for_river();
    change_alignment();
    
    show_biwta_value();
    show_bwdb_value();
    show_local_value();
    show_railway_value();
    show_others_value();
    
    show_bridge_design_user();
});
var auto_Increment = function(){
	var autoIncrement = $('#nmrw').val();
	$('#nmrw').val(parseInt(autoIncrement) + parseInt(1));
}
var formReset = function(){
	$(".btn-add-client").button('reset');
	$('button[name=enrol_submit]').val('Add');
	$('input[name=Editid]').val('');
	$('#update_close').hide();
	$('#sampleForm')[0].reset();
	
    
    $.post( "ajax/generate_unique_token.php", function( data ) {
        $('#random_number').val(data);
    });
    
    $('#acquisitionRoadTypeFkId').val('');
    show_road_type_others_option();



    $('#acquisitionRoadListFk').val('');
    $('#acquisitionRoadName').val('');
    $('#acquisitionRoadLink').val('');
    $('#acquisitionLocationOfTheBridge').val('');
    $('#acquisitionNameOfTheBridge').val('');
    $('#acquisitionNameOfTheRiver').val('');
    $('#acquisitionNavigationalClearanceValue').val('');
    $('#acquisitionLengthAndSpanArrangementOfTheExistingBridge').val('');
    $('#acquisitionBottomRlOfTheMidSpanGirderOfTheExistingBridge').val('');
    $('#acquisitionExistingFoundation').val('');
    $('#acquisitionExistingFoundationLayout').val('');
    $('#acquisitionHighestFloodLevel').val('');
    $('#acquisitionStandardHighWaterLevel').val('');
    $('#acquisitionLowestWaterLevel').val('');
    $('#acquisitionWaterLevelAtTheTimeOfSurvey').val('');
    $('#acquisitionDate').val('');
    $('#acquisitionDirectionOfStreamFlow').val('');
    $('#acquisitionReferenceBenchMark').val('');
    $('#acquisitionReferencePointOfZeroChainage').val('');
    $('#acquisitionExistenceOfAnyCrossRoad').val('');
    $('#acquisitionRequirementOfPierProtectiveWork').val('');
    $('#acquisitionSoilTestReport').val('');
    $('#acquisitionAlternateBridgeAlignment').val('');
    $('#acquisitionAnIndexMapShowingImportantHatBazaarAndTown').val('');
    $('#acquisitionSitePlanOfTheBridgeSite').val('');
    $('#acquisitionCrossSectionsWithReducedLevel').val('');
    $('#acquisitionIntervalCrossesSections').val('');
    $('#acquisitionAncillaryWork').val('');
    $('#acquisitionProposedLengthOfBridge').val('');
    $('#acquisitionProposedSpanArrangementOfTheBridge').val('');
    $('#acquisitionBottomRLOfMidSpan').val('');
    $('#acquisitionProposedMaximumHeightOfApproachRoad').val('');
    
    $(".list_of_attchFileEight").html('');
    $(".list_of_attchFileSeven").html('');
    $(".list_of_attchFileSix").html('');
    $(".list_of_attchFileFive").html(''); 
    $(".list_of_attchFileFour").html(''); 
    $(".list_of_attchFileThree").html(''); 
    $(".list_of_attachment_file").html(''); 
    $(".list_of_attchFileNine").html('');
    $(".list_of_attchFileEleven").html('');

    
    $('#acquisitionTypeOfRiver').val('');
    $('#acquisitionTidalAtDryHTL').val('');
    $('#acquisitionTidalAtDryLTL').val('');
    $('#acquisitionTidalAtRainyHTL').val('');
    $('#acquisitionTidalAtRainyLTL').val('');
    $('#acquisitionReferenceType').val('');
    
    $('#acquisitionNavigationalClearanceBIWTAClass').val('');
    show_biwta_value();            
    $('#acquisitionNavigationalClearanceBIWTAValue').val('');
    $('#acquisitionNavigationalClearanceBIWTAHeight').val('');
                
                
    $('#acquisitionNavigationalClearanceBWDBClass').val('');
    show_bwdb_value();            
    $('#acquisitionNavigationalClearanceBWDBValue').val('');
    $('#acquisitionNavigationalClearanceBWDBHeight').val('');
                
                
    $('#acquisitionNavigationalClearanceLOCALClass').val('');
    show_local_value();            
    $('#acquisitionNavigationalClearanceLOCALValue').val('');
    $('#acquisitionNavigationalClearanceLOCALHeight').val('');
                
                
    $('#acquisitionNavigationalClearanceRailWayClass').val('');
    show_railway_value();            
    $('#acquisitionNavigationalClearanceRailWayValue').val('');
    $('#acquisitionNavigationalClearanceRailWayHeight').val('');
                
                
    $('#acquisitionNavigationalClearanceOTHERSClass').val('');
    show_others_value();            
    $('#acquisitionNavigationalClearanceOTHERSValue').val('');
    $('#acquisitionNavigationalClearanceOTHERSHeight').val('');
    
    
    $('#acquisitionExistingAlignment').val(''); 
    
    show_option_for_river();
    change_alignment();
    
    
    $('#acquisitionFormStatus').val(''); 
    $('#acquisitionBridgeApprovedBy').val(''); 
    show_bridge_design_user();


    $('#acquisitionRoadTypeOthersName').val('');
    $('#acquisitionLocationOfTheBridgeGPSLatitude').val('');
    $('#acquisitionLocationOfTheBridgeGPSLongitude').val('');
    $('#acquisitionLocationOfTheBridgeGPSGoogleMapLink').val('');
    $('#acquisitionNavigationalClearanceOTHERSNote').val('');
    $('#acquisitionLengthOfTheExistingBridge').val('');
    $('#acquisitionSpanArrangementOfTheExistingBridge').val('');
    $('#acquisitionWidthOfChannel').val('');
    $('#acquisitionHighestTideLevel').val('');
    $('#acquisitionLowestTideLevel').val('');

    $("#existingFoundationLayout_yes").prop('checked',false);
    $("#existingFoundationLayout_No").prop('checked',true);
    show_existing_foundation_layout_option('No');

    $('#imgpreview_11').attr("src",'http://via.placeholder.com/600x600&text=No Image');
    $('#imgpreview_12').attr("src",'http://via.placeholder.com/600x600&text=No Image');
    $('#imgpreview_13').attr("src",'http://via.placeholder.com/600x600&text=No Image');
    $('#imgpreview_14').attr("src",'http://via.placeholder.com/600x600&text=No Image');

    remove_demand();

    index = 0;
    var form_count = culvertBoreHoleNosForm.getFormsCount() - 1;
    for (form_count; form_count > 0; form_count--) {
        culvertBoreHoleNosForm.removeForm(form_count);
    };
    $('#culvertBoreHoleNosForm_0_remove').hide();


    $('#culvertBoreHoleNosForm_' + index + '_acquisitionBoreHoleNosGoogleMapLink').val('');
    $('#culvertBoreHoleNosForm_' + index + '_acquisitionBoreHoleNosLatitudeLongitude').val('');
    $('#culvertBoreHoleNosForm_' + index + '_acquisitionBoreHoleNosReferenceType').val('');
    $('#borehole_nos_total').val(0);

    $('#acquisitionRequirementPierWork').val('');
    $('#acquisitionProposedMaxHeightRoad').val('');
    $('#acquisitionAncillaryWork').val('');
    $('#acquisitionExistingCulvertNote').val('');
};
function form_submit() {
	var enrol_submit = $('button[name=enrol_submit]').val();
	$(".btn-add-client").button('loading');
	var datastring = $("#sampleForm").serialize() + "&enrol_submit="+enrol_submit;
	$.ajax({
		type: "POST",
		url: "submit/bridge_acquisition_form_submit.php",
		data: datastring,
		success: function(data) {
			try {
				var obj = $.parseJSON(data);
				if (obj.success == '1') {
					$.notify("Data has been added successfully", "success");
					$.playSound('assets/media/iphonenoti');
					auto_Increment();
					formReset();
					$('.nav-tabs a[href="#tab_list"]').tab('show');
					table.ajax.reload();
                    /*location.reload();*/
					$(".btn-add-client").button('reset');
				} else if (obj.success == '2') {
					$.notify("The data has been updated successfully", "success");
					$.playSound('assets/media/iphonenoti');
					formReset();
					$('.nav-tabs a[href="#tab_list"]').tab('show');
					table.ajax.reload();
                    /*location.reload();*/
					$(".btn-add-client").button('reset');
				} else if (obj.error == 'no_permission') {
					$.notify("You do not have permission!", "error");
					$.playSound('assets/media/iphonenoti');
					$(".btn-add-client").button('reset');
				} else if (obj.error == '3') {
					$.notify("Data already exists!", "error");
					$.playSound('assets/media/iphonenoti');
					$(".btn-add-client").button('reset');
				} else if (obj.error == '4') {
                    $.notify("An Index Map is required", "error");
                    $.playSound('assets/media/iphonenoti');
                    $(".btn-add-client").button('reset');
                } else if (obj.error == '5') {
                    $.notify("Attachment for ACE is required", "error");
                    $.playSound('assets/media/iphonenoti');
                    $(".btn-add-client").button('reset');
                } else if (obj.error == '6') {
                    $.notify("Attachment for SE is required", "error");
                    $.playSound('assets/media/iphonenoti');
                    $(".btn-add-client").button('reset');
                } else if (obj.error == '7') {
					$.notify("Attachment for EE is required", "error");
					$.playSound('assets/media/iphonenoti');
					$(".btn-add-client").button('reset');
				} else {
					$.notify("Please try again", "error");
					$.playSound('assets/media/iphonenoti');
					$(".btn-add-client").button('reset');
				}
			} catch(e) {
				$.notify('Unknown error occured', 'error');
				$.playSound('assets/media/iphonenoti');
				$(".btn-add-client").button('reset');
			}
		},
        error: function(jqXHR, exception) {
            $(".btn-add-client").button('reset');
            if (jqXHR.status === 0) {
                alert('Not connect.\n Verify Network.');
            } else if (jqXHR.status == 404) {
                alert('Requested page not found. [404]');
            } else if (jqXHR.status == 500) {
                alert('Internal Server Error [500].');
            } else if (exception === 'parsererror') {
                alert('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                alert('Time out error.');
            } else if (exception === 'abort') {
                alert('Ajax request aborted.');
            } else {
                alert('Uncaught Error.\n' + jqXHR.responseText);
            }
		}
	});
	return false;
}
var table = $("#tbl-client").DataTable({
	"ajax": "submit/bridge_acquisition_form_submit.php?table_name=dbt_acquisition_form&unique_id=acquisitionID&enrol_submit=view",
	"deferRender": true,
	"order": [
		[1, "asc"]
	],
	"columns": [
	{
		"data": null,
		"width": "2px"
	},
    {"data": "acquisitionCode"},    
    {"data": "acquisitionRoadTypeFkId"},
    {"data": "acquisitionRoadListFk"},
    {"data": "acquisitionRoadName"},
    {"data": "acquisitionNameOfTheBridge"},    
    {"data": "acquisitionLocationOfTheBridge"},
    {"data": "acquisitionRecordedBy"},
    {"data": "downloadForm"},
    {"data": "acquisitionFormStatus"},      
	{
		"data": "editButton"
	}],
	"fnInitComplete": function() {
		$(".dataTables_wrapper").find("select,input").addClass("form-control dataTables_bangla");
		$(".table").css("width", "100%");
		
	}
});
table.on('draw.dt', function() {
	table.column(0, {
		search: 'applied',
		order: 'applied',
		length: 'applied'
	}).nodes().each(function(cell, i) {
		i= i + 1;
		cell.innerHTML = i;
	});
});
$('#tbl-client').on('click', '#btn-edit', function() {
	var ids = $(this).data('temp').replace('Edit-', '');
	var enrol_submit = 'Edit';
	swal({
		title: 'Do you want to Edit?',
		text: "",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
	}).then(function(isConfirm) {
		if (isConfirm) {
			formReset();
			$('.loaderExtraDiv').hide();
			$('.loaderDiv').show();
			$('#update_close').show();
			$.getJSON("submit/bridge_acquisition_form_submit.php?enrol_submit=edit&table_name=dbt_acquisition_form&unique_id=acquisitionID&unique_row=acquisitionRoadName&Editid=" + ids, function(data) {
				$('button[name=enrol_submit]').val(enrol_submit);
				$('input[name=Editid]').val(ids);

$('#random_number').val(data.random_number);                
$('#acquisitionRoadTypeFkId').val(data.acquisitionRoadTypeFkId).change();
show_road_type_others_option();

$('#acquisitionRoadListFk').val(data.acquisitionRoadListFk);
$('#acquisitionRoadName').val(data.acquisitionRoadName);
$('#acquisitionRoadLink').val(data.acquisitionRoadLink);
$('#acquisitionLocationOfTheBridge').val(data.acquisitionLocationOfTheBridge);
$('#acquisitionNameOfTheBridge').val(data.acquisitionNameOfTheBridge);
$('#acquisitionNameOfTheRiver').val(data.acquisitionNameOfTheRiver);
                

var val = data.acquisitionNavigationalClearanceValue;                
if(val == 'BIWTA'){
    $('#acquisitionNavigationalClearanceValue_biwta').prop('checked',true);
    show_navigational_option('BIWTA');
}else if(val == 'BWDB'){
    $('#acquisitionNavigationalClearanceValue_bwdb').prop('checked',true);
    show_navigational_option('BWDB');
}else if(val == 'Local'){
    $('#acquisitionNavigationalClearanceValue_local').prop('checked',true);
    show_navigational_option('Local');
}else if(val == 'Railway'){
    $('#acquisitionNavigationalClearanceValue_railway').prop('checked',true);
    show_navigational_option('Railway');
}else if(val == 'Others'){
    $('#acquisitionNavigationalClearanceValue_others').prop('checked',true);
    show_navigational_option('Others');
}           
                
                
$('#acquisitionLengthAndSpanArrangementOfTheExistingBridge').val(data.acquisitionLengthAndSpanArrangementOfTheExistingBridge);
$('#acquisitionBottomRlOfTheMidSpanGirderOfTheExistingBridge').val(data.acquisitionBottomRlOfTheMidSpanGirderOfTheExistingBridge);
$('#acquisitionExistingFoundation').val(data.acquisitionExistingFoundation);
//$('#acquisitionExistingFoundationLayout').val(data.acquisitionExistingFoundationLayout);
$('#acquisitionHighestFloodLevel').val(data.acquisitionHighestFloodLevel);
$('#acquisitionStandardHighWaterLevel').val(data.acquisitionStandardHighWaterLevel);
$('#acquisitionLowestWaterLevel').val(data.acquisitionLowestWaterLevel);
$('#acquisitionWaterLevelAtTheTimeOfSurvey').val(data.acquisitionWaterLevelAtTheTimeOfSurvey);
$('#acquisitionDate').val(data.acquisitionDate);
$('#acquisitionDirectionOfStreamFlow').val(data.acquisitionDirectionOfStreamFlow);
$('#acquisitionReferenceBenchMark').val(data.acquisitionReferenceBenchMark);
$('#acquisitionReferencePointOfZeroChainage').val(data.acquisitionReferencePointOfZeroChainage);
$('#acquisitionExistenceOfAnyCrossRoad').val(data.acquisitionExistenceOfAnyCrossRoad);
$('#acquisitionRequirementOfPierProtectiveWork').val(data.acquisitionRequirementOfPierProtectiveWork);
//$('#acquisitionSoilTestReport').val(data.acquisitionSoilTestReport);
$('#acquisitionAlternateBridgeAlignment').val(data.acquisitionAlternateBridgeAlignment);
//$('#acquisitionAnIndexMapShowingImportantHatBazaarAndTown').val(data.acquisitionAnIndexMapShowingImportantHatBazaarAndTown);
//$('#acquisitionSitePlanOfTheBridgeSite').val(data.acquisitionSitePlanOfTheBridgeSite);
//$('#acquisitionCrossSectionsWithReducedLevel').val(data.acquisitionCrossSectionsWithReducedLevel);
//$('#acquisitionIntervalCrossesSections').val(data.acquisitionIntervalCrossesSections);
$('#acquisitionAncillaryWork').val(data.acquisitionAncillaryWork);
$('#acquisitionProposedLengthOfBridge').val(data.acquisitionProposedLengthOfBridge);
$('#acquisitionProposedSpanArrangementOfTheBridge').val(data.acquisitionProposedSpanArrangementOfTheBridge);
$('#acquisitionBottomRLOfMidSpan').val(data.acquisitionBottomRLOfMidSpan);
$('#acquisitionProposedMaximumHeightOfApproachRoad').val(data.acquisitionProposedMaximumHeightOfApproachRoad);
    
    
$('#acquisitionTypeOfRiver').val(data.acquisitionTypeOfRiver);
$('#acquisitionTidalAtDryHTL').val(data.acquisitionTidalAtDryHTL);
$('#acquisitionTidalAtDryLTL').val(data.acquisitionTidalAtDryLTL);
$('#acquisitionTidalAtRainyHTL').val(data.acquisitionTidalAtRainyHTL);
$('#acquisitionTidalAtRainyLTL').val(data.acquisitionTidalAtRainyLTL);
$('#acquisitionReferenceType').val(data.acquisitionReferenceType);

                
    $('#acquisitionNavigationalClearanceBIWTAClass').val(data.acquisitionNavigationalClearanceBIWTAClass);
    show_biwta_value();            
    $('#acquisitionNavigationalClearanceBIWTAValue').val(data.acquisitionNavigationalClearanceBIWTAValue);
    $('#acquisitionNavigationalClearanceBIWTAHeight').val(data.acquisitionNavigationalClearanceBIWTAHeight);
                
                
    $('#acquisitionNavigationalClearanceBWDBClass').val(data.acquisitionNavigationalClearanceBWDBClass);
    show_bwdb_value();            
    $('#acquisitionNavigationalClearanceBWDBValue').val(data.acquisitionNavigationalClearanceBWDBValue);
    $('#acquisitionNavigationalClearanceBWDBHeight').val(data.acquisitionNavigationalClearanceBWDBHeight);
                
                
    $('#acquisitionNavigationalClearanceLOCALClass').val(data.acquisitionNavigationalClearanceLOCALClass);
    show_local_value();            
    $('#acquisitionNavigationalClearanceLOCALValue').val(data.acquisitionNavigationalClearanceLOCALValue);
    $('#acquisitionNavigationalClearanceLOCALHeight').val(data.acquisitionNavigationalClearanceLOCALHeight);
                
                
    $('#acquisitionNavigationalClearanceRailWayClass').val(data.acquisitionNavigationalClearanceRailWayClass);
    show_railway_value();            
    $('#acquisitionNavigationalClearanceRailWayValue').val(data.acquisitionNavigationalClearanceRailWayValue);
    $('#acquisitionNavigationalClearanceRailWayHeight').val(data.acquisitionNavigationalClearanceRailWayHeight);
                
                
    $('#acquisitionNavigationalClearanceOTHERSClass').val(data.acquisitionNavigationalClearanceOTHERSClass);
    show_others_value();            
    $('#acquisitionNavigationalClearanceOTHERSValue').val(data.acquisitionNavigationalClearanceOTHERSValue);
    $('#acquisitionNavigationalClearanceOTHERSHeight').val(data.acquisitionNavigationalClearanceOTHERSHeight);              
                
                
                
    $('#acquisitionExistingAlignment').val(data.acquisitionExistingAlignment);                 
                
    show_option_for_river(); 
    change_alignment();
        
    
    $('#acquisitionFormStatus').val(data.acquisitionFormStatus); 
    $('#acquisitionBridgeApprovedBy').val(data.acquisitionBridgeApprovedBy); 
    show_bridge_design_user();


$('#acquisitionRoadTypeOthersName').val(data.acquisitionRoadTypeOthersName);
$('#acquisitionLocationOfTheBridgeGPSLatitude').val(data.acquisitionLocationOfTheBridgeGPSLatitude);
$('#acquisitionLocationOfTheBridgeGPSLongitude').val(data.acquisitionLocationOfTheBridgeGPSLongitude);
$('#acquisitionLocationOfTheBridgeGPSGoogleMapLink').val(data.acquisitionLocationOfTheBridgeGPSGoogleMapLink);
$('#acquisitionNavigationalClearanceOTHERSNote').val(data.acquisitionNavigationalClearanceOTHERSNote);
$('#acquisitionLengthOfTheExistingBridge').val(data.acquisitionLengthOfTheExistingBridge);
$('#acquisitionSpanArrangementOfTheExistingBridge').val(data.acquisitionSpanArrangementOfTheExistingBridge);
$('#acquisitionWidthOfChannel').val(data.acquisitionWidthOfChannel);
$('#acquisitionHighestTideLevel').val(data.acquisitionHighestTideLevel);
$('#acquisitionLowestTideLevel').val(data.acquisitionLowestTideLevel);

if(data.existingFoundationLayout == "Yes"){
    $("#existingFoundationLayout_No").prop('checked',false);
    $("#existingFoundationLayout_yes").prop('checked',true);

}else{
    $("#existingFoundationLayout_yes").prop('checked',false);
    $("#existingFoundationLayout_No").prop('checked',true);
}
show_existing_foundation_layout_option(data.existingFoundationLayout);


                var site_picture = data.site_picture.split('@pg@');
                $.each( site_picture, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        if(obj[1] == 'East'){
                            $('#imgpreview_11').attr("src",'cdn/temp/'+obj[2]);
                        }
                        if(obj[1] == 'West'){
                            $('#imgpreview_12').attr("src",'cdn/temp/'+obj[2]);
                        }
                        if(obj[1] == 'North'){
                            $('#imgpreview_13').attr("src",'cdn/temp/'+obj[2]);
                        }
                        if(obj[1] == 'South'){
                            $('#imgpreview_14').attr("src",'cdn/temp/'+obj[2]);
                        }
                    }
                });

                var demand_letter = data.demand_letter.split('@pg@');
                $.each( demand_letter, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileEleven").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank"' +
                            ' class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionNavigationalClearance = data.acquisitionNavigationalClearance.split('@pg@');
                $.each( acquisitionNavigationalClearance, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileEight").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');       
                    }
                });
                
                var acquisitionExistingFoundationLayout = data.acquisitionExistingFoundationLayout.split('@pg@');
                $.each( acquisitionExistingFoundationLayout, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileSeven").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionSoilTestReport = data.acquisitionSoilTestReport.split('@pg@');
                $.each( acquisitionSoilTestReport, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileSix").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionAnIndexMapShowingImportantHatBazaarAndTown = data.acquisitionAnIndexMapShowingImportantHatBazaarAndTown.split('@pg@');
                $.each( acquisitionAnIndexMapShowingImportantHatBazaarAndTown, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileFive").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionSitePlanOfTheBridgeSite = data.acquisitionSitePlanOfTheBridgeSite.split('@pg@');
                $.each( acquisitionSitePlanOfTheBridgeSite, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileFour").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionCrossSectionsWithReducedLevel = data.acquisitionCrossSectionsWithReducedLevel.split('@pg@');
                $.each( acquisitionCrossSectionsWithReducedLevel, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileThree").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                var acquisitionIntervalCrossesSections = data.acquisitionIntervalCrossesSections.split('@pg@');
                $.each( acquisitionIntervalCrossesSections, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attachment_file").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });
                
                
                var acquisitionHydroMorphologicalStudyReport = data.acquisitionHydroMorphologicalStudyReport.split('@pg@');
                $.each( acquisitionHydroMorphologicalStudyReport, function( key, value ) {
                    if(value !== ''){
                        var obj = value.split('|pg|');
                        $(".list_of_attchFileNine").append('<div class="makale-dosya col-sm-2"><center><a href="cdn/temp/'+obj[2]+'" target="_blank" class="btn btn-lg btn-primary btn-block">'+obj[1]+'</a><br><a href="javascript:void(0)" id="btn-delete" class="btn btn-danger btn-xs close-div btn-delete-'+obj[0]+'" data-temp="Delete-'+obj[0]+'" data-loading-text="<i class=\'\fa fa-circle-o-notch fa-spin\'\></i>">Delete</a></center></div>');
                    }
                });

                remove_demand();




                $('#borehole_nos_total').val(data.borehole_nos_total);

                if (data.acquisitionBoreHoleNosGoogleMapLink && data.acquisitionBoreHoleNosGoogleMapLink !== '') {
                    var _acquisitionBoreHoleNosGoogleMapLink = data.acquisitionBoreHoleNosGoogleMapLink.split('@@pg@@');
                } else {
                    var _acquisitionBoreHoleNosGoogleMapLink = [];
                }

                if (data.acquisitionBoreHoleNosLatitudeLongitude && data.acquisitionBoreHoleNosLatitudeLongitude !== '') {
                    var _acquisitionBoreHoleNosLatitudeLongitude = data.acquisitionBoreHoleNosLatitudeLongitude.split('@@pg@@');
                } else {
                    var _acquisitionBoreHoleNosLatitudeLongitude = [];
                }

                if (data.acquisitionBoreHoleNosReferenceType && data.acquisitionBoreHoleNosReferenceType !== '') {
                    var _acquisitionBoreHoleNosReferenceType = data.acquisitionBoreHoleNosReferenceType.split('@@pg@@');
                } else {
                    var _acquisitionBoreHoleNosReferenceType = [];
                }

                var numberOfElements = _acquisitionBoreHoleNosGoogleMapLink.length;
                $.each(_acquisitionBoreHoleNosGoogleMapLink, function(ind, det) {
                    console.log(det);
                    $('#culvertBoreHoleNosForm_' + ind + '_acquisitionBoreHoleNosGoogleMapLink').val(_acquisitionBoreHoleNosGoogleMapLink[ind]);
                    $('#culvertBoreHoleNosForm_' + ind + '_acquisitionBoreHoleNosLatitudeLongitude').val(_acquisitionBoreHoleNosLatitudeLongitude[ind]);
                    $('#culvertBoreHoleNosForm_' + ind + '_acquisitionBoreHoleNosReferenceType').val(_acquisitionBoreHoleNosReferenceType[ind]);

                    if (ind < numberOfElements - 1) {
                        culvertBoreHoleNosForm.addForm();
                    }
                });


                $('#acquisitionRequirementPierWork').val(data.acquisitionRequirementPierWork);
                $('#acquisitionProposedMaxHeightRoad').val(data.acquisitionProposedMaxHeightRoad);
                $('#acquisitionAncillaryWork').val(data.acquisitionAncillaryWork);
                $('#acquisitionExistingCulvertNote').val(data.acquisitionExistingCulvertNote);

                $('#acquisitionReferenceBenchMarkGPSGoogleMapLink').val(data.acquisitionReferenceBenchMarkGPSGoogleMapLink);
                $('#acquisitionReferenceBenchMarkGPSLatitudeLongitude').val(data.acquisitionReferenceBenchMarkGPSLatitudeLongitude);


                $('#acquisitionReferencePointOfZeroChainageGoogleMapLink').val(data.acquisitionReferencePointOfZeroChainageGoogleMapLink);
                $('#acquisitionReferencePointOfZeroChainageLatitudeLongitude').val(data.acquisitionReferencePointOfZeroChainageLatitudeLongitude);


                $('.loaderDiv').hide();
				$('.loaderExtraDiv').show();
			});
			$('.nav-tabs a[href="#form"]').tab('show');
		}
	});
});
$('#tbl-client').on('click', '#btn-delete', function() {
	if (confirm('Do you want to Delete?')) {
		var id = $(this).data('temp').replace('Delete-', '');$('.btn-delete-'+id).button('loading');
		$.post("submit/bridge_acquisition_form_submit.php?id=" + id + "&table=operation&unique_id=acquisitionID&enrol_submit=Delete", function(response) {
			var obj = $.parseJSON(response);
			if (obj.success == '1') {
				$.notify("Data deleted successfully", "success");
				table.ajax.reload();
			} else if (obj.error == '1') {
				$('.btn-delete-'+id).button('reset');
				$.notify("You have to shift all data associated with it before deletion", "error");
			} else {
				$('.btn-delete-'+id).button('reset');
				$.notify("Please try again", "error");
			}
		});
	}
});

$(document).on('click', '.close-div', function(event) {	
    $(this).parent().parent().remove();
    var id = $(this).data('temp').replace('Delete-', '');
    $('.btn-delete-'+id).button('loading');
    $.post("submit/delete.php?id=" + id + "&table_name=dbt_attachment&unique_id=attchID&enrol_submit=Delete", function(response) {
        var obj = $.parseJSON(response);
        if (obj.success == '1') {
            $.notify("Data deleted successfully", "success");
        } else {
            $('.btn-delete-'+id).button('reset');
            $.notify("Please try again", "error");
        }
        remove_demand();
    });
    remove_demand();
});