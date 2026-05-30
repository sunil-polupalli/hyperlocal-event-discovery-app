# Personalization Strategy: Implicit Signals vs. Collaborative Filtering

This document outlines the recommendation engine architecture for our Hyperlocal Event Discovery App, detailing the current implicit personalization implementation and comparing it against traditional collaborative filtering models.

## 1. Current Implementation: Implicit Personalization

Our application utilizes an **implicit personalization** strategy to generate the "For You" feed. Instead of asking users to manually select their interests (explicit), or relying on the behavior of other users, the system learns autonomously by quietly observing the user's natural engagement patterns.

### Architecture Pipeline
1.  **Signal Capture:** When a user navigates to an event details screen and dwells for at least 5 seconds, the mobile client triggers an asynchronous background request.
2.  **Data Storage:** The backend Express server receives this view signal and logs it into a lightweight SQLite database (`signals` table), recording the `userId`, `eventId`, and the event's `category`.
3.  **Real-Time Analysis:** When the user accesses the "For You" tab, the backend executes an aggregation query (`COUNT(*) ... GROUP BY category`) against the SQLite database to extract the user's top two most frequently viewed event categories.
4.  **Dynamic Filtering:** These top categories are immediately passed into the Typesense search engine as an `OR` filter (`category:=[Category1, Category2]`). Typesense rapidly returns a personalized feed of fully structured event documents matching those specific interests.

## 2. The Alternative: Collaborative Filtering

**Collaborative Filtering** is a fundamentally different recommendation strategy that assumes that if User A and User B share similar tastes in certain items, they will likely share similar tastes in other items. 

It generally takes two forms:
* **User-Based:** "Users who are similar to you also viewed..."
* **Item-Based:** "Users who viewed this event also viewed..."

Rather than just looking at what one individual user is doing, collaborative filtering builds a massive matrix comparing every user against every item in the database, often using machine learning techniques like Matrix Factorization or nearest-neighbor algorithms to predict what a user might want to see next.

## 3. Comparative Trade-offs

When designing the backend for this hyperlocal event application, we chose implicit category filtering over collaborative filtering due to several critical trade-offs:

### A. The "Cold Start" Problem
* **Collaborative Filtering:** Suffers heavily from the cold start problem. If a brand new event is added to the city, collaborative filtering won't recommend it to anyone until a critical mass of users has already interacted with it. 
* **Our Implicit System:** Immune to item cold starts. Because it filters by *category*, the moment a new "Arts & Theatre" event is added to the Typesense database, it will instantly appear in the feed of any user who has demonstrated an interest in the arts. Furthermore, if a new user has zero history, our system gracefully falls back to a broad, unfiltered query until they click their first event.

### B. Infrastructure and Compute Complexity
* **Collaborative Filtering:** Requires heavy computational overhead. As the user base grows, calculating similarity matrices becomes exceedingly slow and expensive, often requiring dedicated machine learning pipelines and separate compute instances.
* **Our Implicit System:** Extremely lightweight. It relies on a fast SQLite aggregation query and native Typesense filtering features, allowing the recommendation engine to run seamlessly on the same small Docker container as the primary API.

### C. Privacy and Data Siloing
* **Collaborative Filtering:** Inherently mixes behavioral data across the entire user base. To make a recommendation, the system must process what everyone else is doing.
* **Our Implicit System:** Highly privacy-centric. A user's recommendations are generated *solely* from their own viewing history. Their data never needs to be compared against or mixed with other users' profiles.

## Conclusion

For a scalable, hyperlocal MVP, implicit category personalization provides the best balance of immediate user value and backend simplicity. It delivers highly relevant recommendations with virtually zero computational overhead while avoiding the cold-start limitations that plague collaborative ML models.