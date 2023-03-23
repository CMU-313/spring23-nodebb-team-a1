## Testing searchTopics

## Where to find added automated tests
We have added automated tests for our searching feature, which is found in test/topics.js. The searching feature function being tested can be found in src/topics/searchTopics.js and src/topics/searchTopics.ts. 

## What is being tested
The function being tested is searchTopics, found in the mentioned files above. There are three cases we test for. Before we acutally use the function, we ensure that the parameter (keyword given) is not empty. This prevents errors that could be caused by searching the database for nothing. Second, we test that the function does correctly return when the given parameter can be found in the posts. Lastly, we test that function does not return anything when the given parameter is not found in any of the posts. This can be found in test/topics.js lines 2859-2865. 

## Why the tests are sufficient
The tests added are sufficient because they test the only two cases of the searchTopics function. Which is that either it returns posts or does not return posts, depending on the keyword searched. These automated tests, along with our user interface testing, give us confidence that testing for the feature is sufficient. 

## How to use and user test the feature
To use and user test this feature, navigate to the "Recents" tab. It is located at the navigation bar, and has a clock icon. Then you will see a search bar, that says "Search for post". As you begin to type a keyword, you will see relevant posts appearing, and non-relevant posts disappearing. If you search for a title that does not belong to any post, no posts will be shown. If you search for a title of an existing post, you will see that post appearing. You will also be able to click on that post to view it in detail. If you wish to view all recent posts, simply delete the keyword you have entered in the search bar. 