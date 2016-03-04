# Spotz
> An application designed to display parking options based on location, date and time of day.  
[Click here to checkout Spotz](http://spotz.herokuapp.com/)
<img src="/readme_images/screenshot1.png" style="height: 500px; width:500px;">
<br>

## Team

  - __Product Owner__: Adesola Harrison
  - __Scrum Master__: Daniel Kim
  - __Development Team Members__: Raphael Baskerville, Nicolas Bauer, Adesola Harrison, Daniel Kim

## Table of Contents

1. [Usage](#Usage)
1. [Requirements](#requirements)
1. [Development](#development)
1. [Installing Dependencies](#installing-dependencies)
1. [Tasks](#tasks)
1. [Team](#team)
1. [Contributing](#contributing)

## Requirements
"node": "5.4.1"
<br>"npm": "3.3.12"


### Installing Dependencies
Spotz is a MEAN application, so you need to:   
  - install <a href="https://nodejs.org/en/">node</a> (version 5.4.1 or higher).     
  - download the above repo and run "npm install" from the root directory to download all required dependencies.  
  - configure a MongoDB connection in server/db.js.  
  - run node server/server.js and the server should be up and running.    

### Usage
**Mobile and Desktop Version**   
**Getting started:**  
Login or signup with a Google or Facebook account...or create an account with Spotz.

**Navigating the map**   
Zoom in or out with  +/- buttons.  
1. Click and drag the map in any direction.  
2. Click any highlighted area to display a tool tip with detailed parking info.

<b>Options for displaying parking information by location:</b>      
1. Enter a time, date and duration in the mobile preview field and click submit.  
2. Enter an address into the search bar.
Note: Use the show and hide to limit the info that is displayed.


<h4>Admin</h4><i>To enable admin privildges for a user (Desktop version only):</i>
Go into the database and set the "admin" column for the user to "true".

<b>Admin Options</b>    
Add a rule to street sweeping lines or individual permit zone polygons:  
1. Click the line or polygon.  
2. Click the "Add Rule" button in the sidebar.  
3. Enter the rule info and click the "add rule to selected feature" button.  


<b>Delete a rule:</b>  
1. Click the object to open its tooltip.  
2. Click the delete rule for the rule of interest.  

<b>Add a new polygon:</b>  
1. Click the "Add Feature" button.  
2. Click "enable" button.  
3. Click the map on at least 3 points to make the polygon.  
4. Save or delete the new polygon with the respective buttons.  


###Deployed Site
<a href="https://spotz.herokuapp.com">https://spotz.herokuapp.com</a>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
