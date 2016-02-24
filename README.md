# Spotz
> An application designed to display parking options based on location, date and time of day.

<img src="screenshot1.png" style="height: 500px; width:500px;">
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
Spotz is a MEAN application, so you need to install <a href="https://nodejs.org/en/">node</a> (version 5.4.1 or higher). 
<br>Then, download the above repo and run "npm install" from the root directory to download all 
required dependencies. <br>You need to configure a MongoDB connection in server/db.js. After that, 
run node server/server.js and the server should be up and running.

## Usage
<h4>Mobile and Desktop Version</h4>
<b>Getting started:</b>
<br>Login or signup with a Google or Facebook account...or create an account with Spotz.
<br><br>
<b>Navigating the map.</b>
<br>1. Zoom in or out with  +/- buttons.
<br>2. Click and drag the map in any direction.
<br>3. Click any highlighted area to display a tool tip with detailed parking info.
<br><br>
<b>Options for displaying parking information by location:</b>
<br>1. Enter a time, date and duration in the mobile preview field and click submit.
<br>2. Enter an address into the search bar.
<br>Note: Use the show and hide to limit the info that is displayed.

<br><br>
<h4>Admin</h4><i>To enable admin privildges for a user (Desktop version only):</i>
<br>Go into the database and set the "admin" column for the user to "true".
<br><br>
<b>Admin Options</b>
<br>Add a rule to street sweeping lines or individual permit zone polygons:
<br>1. Click the line or polygon.
<br>2. Click the "Add Rule" button in the sidebar.
<br>3. Enter the rule info and click the "add rule to selected feature" button..
<br>
<br>
<b>Delete a rule:</b>
<br>1. Click the object to open its tooltip.
<br>2. Click the delete rule for the rule of interest.
<br><br>
<b>Add a new polygon:</b>
<br>1. Click the "Add Feature" button.
<br>2. Click "enable" button.
<br>3. Click the map on at least 3 points to make the polygon.
<br>4. Save or delete the new polygon with the respective buttons.


## Development





### Roadmap

View the project roadmap [here](LINK_TO_PROJECT_ISSUES)


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
