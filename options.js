// Saves options to localStorage.
function save_options() {
    var input = document.getElementById("hostname");
    var hostname = input.value;
    localStorage["hostname"] = hostname;
    var checkbox = document.getElementById("appletv_checkbox");
    localStorage["appletv"] =checkbox.checked.toString();
  
    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options saved.";
    setTimeout(function() {
      status.innerHTML = "";
    }, 750);
    chrome.extension.getBackgroundPage().window.location.reload();
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    var hostname = localStorage["hostname"];
    var input = document.getElementById("hostname");
    console.log(typeof localStorage['appletv']) 
    console.log(localStorage['appletv']) 
    if (!hostname) {
  	    input.value = "apple-tv.local";
  	    document.getElementById("appletv_checkbox").checked=true;
    }
    else {
	    input.value = localStorage['hostname'];
        if (localStorage['appletv']=='true'){
	        document.getElementById("appletv_checkbox").checked=true;
        }else{
	    document.getElementById("appletv_checkbox").checked=false;
    }
  }
}


document.querySelector('#save').addEventListener('click', save_options);
document.addEventListener('DOMContentLoaded', restore_options);
