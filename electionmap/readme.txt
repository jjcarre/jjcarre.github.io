I implemented the representation of the results on an actual map of the United States.
For this I used topojson.

Other Notes:
The states are colored according to difference in percentage between the vote counts.
I chose this measure, because even though some of the vote counts are wrong, I will at least be using
percentages that add up to 100%. When I noticed an error in vote counts I tried to correct it as it
usually seemed to be on the order of 10.

I implemented my tooltip to only display if a state is hovered for 200 ms, so that if the user runs their
cursor over the map they do not see the tooltip pop-up partially over every state.

Hawaii and Alaska were not states before 1960 so I did not display them in elections before that year.
