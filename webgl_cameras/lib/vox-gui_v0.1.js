/*-------------------------------------------------------------------------
    This file is part of Voxelent's Graphical User Interface: vox-gui

    vox-gui is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation version 3.

    vox-gui is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with vox-gui.  If not, see <http://www.gnu.org/licenses/>.
---------------------------------------------------------------------------*/ 

//Checking dependencies

if (!$.ui){ //JQuery UI is loaded
    alert('vox-gui: jQuery UI is not loaded. Please include JQuery UI in your page');
}

if (!vxl){
    alert('vox-gui: Voxelent is not loaded!');
}

function vxlGUI(view){
    var e = vxl.events;
    vxl.go.notifier.subscribe([
        e.MODEL_NEW,
        e.MODELS_LOADING,
        e.MODELS_LOADED,
    ], this);
    
    this.view = view;
    this.canvas           = $('canvas#'+this.view.name); 

    this.jqOverlay        = undefined;
    this.jqProgressBar    = undefined;
    this.jqMessage        = undefined;

    this.count            = 0;
    this.loaded           = 0;
    this.createGUI();
};

/**
 * 
 */
vxlGUI.prototype.createGUI = function(){
    
    var pbdiv = document.createElement('div');
    pbdiv.id = this.view.name+'-progressbar-container';
    pbdiv.style.position  = 'absolute';
    pbdiv.style.width     = this.canvas.width();
    pbdiv.style.height    = this.canvas.height();
    pbdiv.style.top       = '4px';
    pbdiv.style.fontFamily  = 'Arial, Helvetica';
    pbdiv.style.fontSize    = '13px';
    pbdiv.style.display     = 'table-cell';
    pbdiv.style.verticalAlign  = 'middle';
    pbdiv.style.textAlign      = 'center';
    pbdiv.style.backgroundImage = "url('http://voxelent.com/html/demos/css/img/vox-gui-logo.png')";
    pbdiv.style.backgroundRepeat = 'no-repeat';
    pbdiv.style.backgroundPosition = 'center '+Math.round(this.canvas.height()/3);
    pbdiv.style.borderColor  = '#ccc'
    pbdiv.style.borderStyle = 'solid';
    pbdiv.style.borderWidth = '1px';
    
    this.jqOverlay = $(pbdiv);
    
    
    
    var pb = document.createElement('div');
    pb.div = this.view.name+'-progressbar';
    pb.style.position  = 'relative';
    pb.style.display   = 'inline-block';
    pb.style.textAlign = 'center';
    pb.style.width     = '80%';
    pb.style.height   =   '25px';
    pb.style.top      = this.canvas.height()/2;
    this.jqProgressBar = $(pb);
    
    var msg = document.createElement('div');
    msg.style.position   = 'relative';
    msg.style.textAlign   = 'center';
    msg.style.top         = this.canvas.height()/2 + 20;
    this.jqMessage = $(msg);
    
    this.jqOverlay.append(this.jqProgressBar); 
    this.jqOverlay.append(this.jqMessage);
     
};


vxlGUI.prototype.showOverlay = function(){
    this.canvas.hide();
    this.canvas.parent().append(this.jqOverlay);
};

vxlGUI.prototype.initProgressBar = function(mmanager){
    this.count = mmanager.toLoad.length;
    this.jqProgressBar.progressbar({value:0});
    this.jqMessage.html('<p>Loading...</p>');
};


vxlGUI.prototype.updateProgressBar = function(mmanager){
    this.loaded = this.count - mmanager.toLoad.length;
    var percentage = Math.round((1- (mmanager.toLoad.length / this.count)) * 100);
    this.jqMessage.html('<p>Loading: ' + this.loaded + ' out of '+ this.count+' ('+percentage+'%)</p>');
    this.jqProgressBar.progressbar({value:percentage});
};    


vxlGUI.prototype.hideOverlay = function(){
    this.jqProgressBar.progressbar({value:100});
    this.jqOverlay.fadeOut(300).hide();
    this.canvas.fadeIn(300);
};

vxlGUI.prototype.handleEvent = function(event, source){
    var e = vxl.events;
    switch(event){
        case e.MODELS_LOADING: this.showOverlay(); 
                               this.initProgressBar(source); 
                               break;
        case e.MODEL_NEW:      this.updateProgressBar(source); 
                               break;
        case e.MODELS_LOADED:  this.hideOverlay(source);  
                               break;
    }
};
