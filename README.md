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

The [initial spec sheet](ybar.pdf) for the software provides a great place to learn about how ybar is implemented. While implementing the software, we stumbled upon a few insights. Here's a document that discusses the [workflow and the general application architecture](app_architecture_workflow.md).

### Potential Applications

- [Potential Applications](potential_applications.md)

### License

The code relies heavily on other open source software. And the licensing restrictions noted by the respective open source software apply. Whatever amendments have been made at our end are released under the [MIT License](https://opensource.org/licenses/MIT). 
