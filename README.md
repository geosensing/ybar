## ybar: Raising the Bar on Data Collection

The repository contains code for a web based mobile phone application for crowdsourcing collection of geographically distributed data. 

### ybar

Good data is vital for insight, but it is hard to get, especially with current tools. Current tools are often grossly limited. Traditional surveys, for instance, collect data *only on the people filling the surveys*, and even then, only very *limited data* --- self-reports about what people do.

*ybar* changes that. It is a platform for collecting statistically sound metrics for geographic regions (cites, forests, villages, states, etc.) --- noise pollution, air pollution, uncollected garbage, bird sightings, trees, average number of potholes per square kilometer, average proportion of women on the street (a measure of their participation in the public life), etc. 

There are three key innovations:

1. Statistically sound estimates: Lot of people propose using passive data collection, but it is a flawed idea given imbalances in who will download your application, and switch it on where and when. Use the software to randomly sample locations (and times) and pay people to go to specific locations at specific times.

2. Rich and verifiable data: With the power of cheap sensors, we can today collect a rich variety of data. And we can verify that the person assigned to collect the data was at a particular location and particular time through passive data collection on location and time, and active data collection measures like taking a selfie at the location.

3. ML-based backend: Say we ask people to click photos of the streets to estimate potholes. But wouldn't it be neat to estimate the average number of potholes and average size automatically? With a ML-based backend trained on crowd-sourced data, we finally can. And over time, we can build a lot of these pipelines.

### How Does *ybar* Work?

The [initial spec sheet](ybar.pdf) for the software provides a great place to learn about how *ybar* is implemented. While implementing the software, we stumbled upon a few insights. The final version is a bit different. 

We illustrate a potential workflow supported by the application with a concrete example:

A 'research company' (you) take request from a researcher to estimate the [proportion of women on the streets in Delhi](https://github.com/geosensing/women-count). You use [geo_sampling](https://github.com/geosensing/geo_sampling) to come up with a sample of locations, and [allocator](https://github.com/geosensing/allocator) to come up with daily itineraries for the people who work for you. You then create tasks and post them to the application. The worker accepts the tasks, takes pictures in a manner specified in the task, the details of which have to be super precise (what angle, what height, etc.), submits the tasks for approval to the administrator (you), and gets money once the submission is approved. Once all the tasks are done, you either link the collected images to a ML-pipeline or to M-Turk to code the images.

### Other Potential Applications

- [Potential Applications](potential_applications.md)

### License

The code relies heavily on other open source software. And the licensing restrictions noted by the respective open source software apply. Whatever amendments have been made at our end are released under the [MIT License](https://opensource.org/licenses/MIT). 
