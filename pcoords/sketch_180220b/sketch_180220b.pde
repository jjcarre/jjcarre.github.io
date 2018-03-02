// Parallel contains 100 data points, small set has 49
// Narrow conatins the same data as Parallel but with fewer dimensions
//String file = "SongData_LargeSet.csv";
//String file = "SongData_Parallel.csv";
String file = "SongData_ParallelNarrow.csv";
//String file = "SongData_SmallSet.csv";
pCoords chart;
PFont bold;
PFont std;
float h;
float w;
boolean bounding, dragAxis;
float xS, yS, xE, yE;

void setup() {
  size(1000, 700);
  surface.setResizable(true);
  loadData(file);
  bold = createFont("Arial Bold", 14);
  std = createFont("Arial", 14);
  //String[] fontList = PFont.list();
  //printArray(fontList);
  h = pixelHeight;
  w = pixelWidth;
  bounding = false;
  dragAxis = false;
}


//variables for timing the ddraw cycle
int fps = millis();
int  last;

void draw() {
  // buttons use pgraphics so they must be reset if canvas changes
  last = millis();
  if (h != pixelHeight || w != pixelWidth) {
    h = pixelHeight;
    w = pixelWidth;
    chart.resetCanvas();
  }
  
  last = millis();

  if (bounding) {
    chart.drawCoordsBound(xS, yS, xE, yE);
    fill(150, 150);
    noStroke();
    rect(xS, yS, xE - xS, yE - yS);
    //println("Bounded draw took " + (millis() - last));
  } else {
     chart.drawCoords();
     //println("Normal draw took " + (millis() - last));
  }
  last = fps;
  fps = millis();
  //println((fps - last));
}



void mouseClicked(MouseEvent evt) {
  //39 is right click, 37 is left click
  if (evt.getButton() == 39) {
    chart.flip();
  } else if (evt.getButton() == 37 ){
    chart.select();
  }
}

int axis;
void mouseDragged() {
  if (!bounding && !dragAxis) {
    xS = mouseX;
    yS = mouseY;
    axis = chart.checkClicks();
    if (axis == -1) {
      bounding = true;
    } else {
      dragAxis = true;
      cursor(MOVE);
      chart.pauseCursor = true;
    }
  }
  xE = mouseX;
  yE = mouseY;
}

void mouseReleased() {
  if (dragAxis) {
    dragAxis = false;
    cursor(ARROW);
    chart.pauseCursor = false;
    chart.moveAxis(axis, xE);
  } else {
    bounding = false;
  }  
  
}

public void loadData(String path) {
  String[] lines = loadStrings(path);
  String[] row = split(lines[0], ",");

  String[] dnames = new String[row.length - 1];
  for (int i = 1; i < row.length; i++) {
    dnames[i-1] = row[i];
  }
  
  String[] names = new String[lines.length-1];
  float[][] values = new float[names.length][dnames.length];
  for (int i = 1; i < lines.length; i++) {
    row = split(lines[i], ",");
    names[i-1] = row[0];
    for (int j = 1; j < row.length; j++) {
      values[i-1][j-1] = Float.parseFloat(row[j]);
    }
  }
  chart = new pCoords(names, dnames, values);
}

  class pCoords {
 public String[] names; //the names of each record
 public String[] dnames;
 public float[][] values; //an object for each dimension
 public float margin = 0.05; //the margin used
 public float[] max, min;
 public int[] order;
 private color[] c; //color used under each dimension
 private boolean[] orient; // orientation for each dimension
 private PGraphics fore;
 private PGraphics back;
 private PGraphics interact;
 public boolean pauseCursor  = false;
 //private boolean hovered = false;
 
 
 int timer;
 //ADD QUARTILES?
 public int select = 0; //the selected axis
 // for coloring the axes
 public color[] scale;
 public color low = color(66, 134, 244); //colors for coloring low and high values
 public color high = color(244, 66, 75);
  
// IN CONSTRUCTOR BUILD VALUES WITH EACH COLUMN SORTED
// KEEP AN ARRAY WHICH ALSO CONTAINS EACH RECORD WITH IT'S LOCATION IN THE SORTED
// COLUMN
// TO SPEED IT UP PROLLY HAVE TO USE A MORE COMPLICATED DATA STRUCTURE
  
  
// tooltips hovering 
 public pCoords(String[] names, String[] dnames, float[][] values) {
   this.names = new String[names.length];
   System.arraycopy(names, 0, this.names, 0 , names.length);
   this.dnames = new String[dnames.length];
   System.arraycopy(dnames, 0, this.dnames, 0, dnames.length);
   
   orient = new boolean[dnames.length];
   c = new color[dnames.length];
   max = new float[dnames.length];
   min = new float[dnames.length];
   order = new int[dnames.length];
   for (int i = 0; i < dnames.length; i++) {
     order[i] = i;
     orient[i] = true;
     c[i] = color(129, 130, i);
     max[i] = MIN_INT;
     min[i] = MAX_INT;
   }
   
   this.values = new float[values.length][values[0].length];
   for (int i = 0; i < values.length; i++) {
     for (int j=0; j < values[0].length; j++) {
       this.values[i][j] = values[i][j];
       if (values[i][j] < min[j]) {
         min[j] = values[i][j];
       } else if (values[i][j] > max[j]) {
         max[j] = values[i][j];
       }
     }
   }
   
   //CHANGE THESE COLORS
   scale = new color[3];
   scale[0] = color(#0000ff);
   scale[1] = color(#ba009e);
   scale[2] = color(#ff0000);
   resetCanvas();
 }
 
 boolean coord ;
 
 // Draw Axis can be sped up 
 
 public void drawCoords() {
   
   float x = pixelWidth * margin * 1.5;
   float interval = pixelWidth * (1 - 2*margin) / (dnames.length -1); // interval is dependent on dimensions 

 
   fore.beginDraw();
   fore.clear();
   fore.endDraw();
   
   int index;
   boolean hover = false;
   if (!pauseCursor) {
     timer = millis();
     hover = drawLines(x, interval);
     //println("Draw Lines took " + (millis() - timer));
   }

   coord = false; //variable for axis hovered
   for(int i = 0; i < dnames.length; i++) {
     index = order[i];
     if (buttonHovered(index))  {
       coord = true;
     }
   }
   drawAxis(x, interval);

   if (!pauseCursor) {
     if (coord) {
       cursor(CROSS);
     } else {
       cursor(ARROW);
     }
   }
   
   //potential to only update axes on change
   image(interact, 0, 0);
   background(255);
   
   timer = millis();
   
   if (hover) {
     tint(100, 50); 
     image(back, 0,0);
     noTint();
     image(fore, 0,0);

   } else {
     image(back, 0,0);
     image(fore, 0,0);
   }

 }
 
 public void updateBack() {
   float x = pixelWidth * margin * 1.5;
   float interval = pixelWidth * (1 - 2*margin) / (dnames.length -1); // interval is dependent on dimensions displayed
   float h0, h1;
    
    back.beginDraw();
    back.clear();
    back.endDraw();
        
    h0 = pixelHeight*margin;
    h1 = pixelHeight*(1-margin);
    for (int i = 0; i < values.length; i++) {
      drawBezier(x, i, h0, h1, interval, false); 
    }
 }
 // draw some on canvas
 
 //DRAW COORDS FOR WHEN BOUNDING BOX IS DRAWN
  public void drawCoordsBound(float xS, float yS, float xE, float yE) {
   float x = pixelWidth * margin * 1.5;
   float interval = pixelWidth * (1 - 2*margin) / (dnames.length -1); // interval is dependent on dimensions displayed
   
   fore.beginDraw();
   fore.clear();
   fore.endDraw();
   
   //timer = millis();
   drawLinesBound(x, interval, min(xS, xE), min(yS, yE), max(xS, xE), max(yS, yE));
   //println("Draw Lines bound " + (millis() - timer));
   coord = false; //variable for axis hovered
   int index;
   timer = millis();
     drawAxis(x, interval);

    println("Draw Axis took " + (millis() - timer));
   
   if (!pauseCursor) {
     if (coord) {
       cursor(CROSS);
     } else {
       cursor(ARROW);
     }
   }
   
   timer = millis();
   image(interact, 0, 0);
   background(255);
   
   tint(100, 50); 
   image(back, 0,0);
   noTint();
   image(fore, 0,0);
        println("Actual draws took " + (millis() - timer));
 }
 
 
 public void drawLinesBound(float x, float interval, float smallX, float smallY, float bigX, float bigY) {
    float h0, h1, y, prevY, t0, t1, y0 , y1;
    int index;
    float tlow = getTFromX(x, max(smallX, x), interval);
    float thigh = getTFromX(x, bigX, interval);
    int check0 = max(0, (int) Math.floor((smallX - x) / interval));
    int check1 = max(0, (int) Math.floor((bigX - x) / interval));
    h0 = pixelHeight*margin;
    h1 = pixelHeight*(1-margin);
    for (int i = 0; i < values.length; i++) {      
      // Check if this curve is hovered
         for (int j = check0; j < check1 + 1; j++) {
           if (j == (check0)) { 
             t0 = tlow;
           } else {
             t0 = 0;
           }
           if (j ==  check1) {
             t1 = thigh;
           } else {
             t1 = 1;
           }
           //don't check if the box is to the left of the graph

           if (t1 > -1) {
             index = order[j+1];
             if (orient[index]) {
               y = map(values[i][index], max[index], min[index], h0, h1);
             }else {
              y = map(values[i][index], min[index], max[index], h0, h1);
             }
             index = order[j];
            if (orient[index]) {
              prevY = map(values[i][index], max[index], min[index], h0, h1);
            }else {
              prevY = map(values[i][index], min[index], max[index], h0, h1);
            }
            
            //do checks before caluclating bezier curve
            if (smallY < min(prevY, y) && bigY > max(prevY, y)) {
              drawBezier(x, i, h0, h1, interval, true); 
              break;
            }
            
            if (t0 == 0) {
             y0 = prevY;
            } else {
             y0 = calcBezier(prevY, prevY, y, y, t0);
            }
            
            if (y0 < bigY && y0 > smallY) {
              drawBezier(x, i, h0, h1, interval, true); 
              break;
            }
            
            if (t1 == 1) {
              y1 = y;
            } else {
              y1 = calcBezier(prevY, prevY, y, y, t1);
            }
            
            if (!((smallY < min(y0, y1) && bigY < min(y0, y1)) || (smallY > max(y0, y1) && bigY > max(y0, y1)))) {
              drawBezier(x, i, h0, h1, interval, true); 
              break;
            }
           }
        }    
      }
  }
 
 
 
 public boolean drawLines(float x, float interval) {
    float h0, h1, y, prevY;
    int check, index;
    boolean retHover = false;
    float t = getTFromX(x, mouseX, interval);

    h0 = pixelHeight*margin;
    h1 = pixelHeight*(1-margin);
    float textMax0 = MIN_INT;
    float textMin0 = MAX_INT;
    float textMax1 = MIN_INT;
    float textMin1 = MAX_INT;
    for (int i = 0; i < values.length; i++) {
      
      // Check if this curve is hovered
      if (t >-1) {
         check = (int) Math.floor((mouseX - x) / interval);
         index = order[check+1];
          if (orient[index]) {
            y = map(values[i][index], max[index], min[index], h0, h1);
          }else {
            y = map(values[i][index], min[index], max[index], h0, h1);
          }
          index = order[check];
          if (orient[index]) {
            prevY = map(values[i][index], max[index], min[index], h0, h1);
          }else {
            prevY = map(values[i][index], min[index], max[index], h0, h1);
          }

        if (abs(mouseY - calcBezier(prevY, prevY, y, y, t)) < 4) {
          fore.beginDraw();
          if (!retHover) {
          retHover = true;
          //fore.background(255);
          }
          if (prevY > pixelHeight / 2) {
             fore.textAlign(LEFT, BOTTOM);
          } else {
             fore.textAlign(LEFT, TOP );
          }
          fore.text(values[i][order[check]], x + check * interval, prevY);
          if (y > pixelHeight / 2) {
             fore.textAlign(LEFT, BOTTOM);
          } else {
             fore.textAlign(LEFT, TOP);
          }
          fore.text(values[i][order[check + 1]], x + (check + 1) * interval, y);
          fore.rectMode(CENTER);
          fore.textAlign(CENTER, CENTER);
          fore.textLeading(12);
          fore.text(names[i], x/2, map(values[i][order[0]], max[order[0]], min[order[0]], h0, h1), x-1, 50);
         

          fore.endDraw();
          drawBezier(x, i, h0, h1, interval, true); 
        }
      }
    }
    return retHover;
  }
  
public float getTFromX (float x, float xPos, float interval) {
  int check;
  //This is checking for the t that corresponds to the x of mouseX
    float t = -1;
    //First check that mouse is in teh graph bounds
    if (xPos < pixelWidth - x && xPos >= x) {
      //get the segment its in
      check = (int) Math.floor((xPos - x) / interval);
      if (check < dnames.length && check >= 0) {
        float tol = 0.5;
        //subtract left axis from here
        float xT = xPos - x - interval * check;
        float lower = 0;
        float upper = 1;
         t = xT/interval;
        float xC = calcBezier(0, interval/2, interval/2, interval, t);
        while(abs(xT - xC) > tol) {
          if (xT > xC) {
            lower = t;
          } else {
            upper = t;
          }
          t = (upper + lower) / 2;
          xC = calcBezier(0, interval/2, interval/2, interval, t);
        }
      }
    }
    return t;
}
  
public void drawBezier(float x, int i, float h0, float h1, float interval, boolean hover) {
      float y;
      boolean first = true;
      float  prevY = 0;
      int index;
      if(hover) { // if hovered draw in foreground
        fore.beginDraw();
        fore.noFill();
        fore.beginShape();
        for (int j = 0; j < dnames.length; j++) {
          //check the orientation
          index = order[j];
          if (orient[index]) {
            y = map(values[i][index], max[index], min[index], h0, h1);
          }else {
            y = map(values[i][index], min[index], max[index], h0, h1);
          } 
            //if this is the first point it must start the curve
          if (first) {
            fore.vertex(x, y);
            first = false;
          } else {
            fore.bezierVertex(x - interval/2, prevY, x - interval/2, y, x, y);
          }
          prevY = y;
          x += interval;
      }
      
      //Color this vertex according to where it is in selected axis
      int relY  =  floor(map(values[i][select], max[select], min[select], 0, 2.99));
      if (orient[select]) {
        fore.stroke(scale[2-relY]);
      } else {
        fore.stroke(scale[relY]);
      }

      fore.endShape();
      fore.endDraw();
      } else { //If the point is not hovered draw it in the background
      
        back.beginDraw();
        back.noFill();
        back.beginShape();
        for (int j = 0; j < dnames.length; j++) {
          //check the orientation
          index = order[j];
          if (orient[index]) {
            y = map(values[i][index], max[index], min[index], h0, h1);
          }else {
            y = map(values[i][index], min[index], max[index], h0, h1);
          }
            //if this is the first point it must start the curve
          if (first) {
            back.vertex(x, y);
            first = false;
          } else {
            back.bezierVertex(x - interval/2, prevY, x - interval/2, y, x, y);
          }
          prevY = y;
          x += interval;
      }
      int relY  =  floor(map(values[i][select], max[select], min[select], 0, 2.99));
      if (orient[select]) {
        back.stroke(scale[2-relY]);
      } else {
        back.stroke(scale[relY]);
      }
      back.endShape();
      back.endDraw();
      }
        
}
 
 // Function for calculating point on bezier curve based on t
 public float calcBezier(float x0, float x1, float x2, float x3, float t) {
  return pow(1-t, 3) * x0 + 3 * pow(1-t, 2) * t * x1 + 3 * (1-t) * pow(t, 2) * x2 + pow(t,3) * x3;
}
 
 
 public void drawAxis(float x, float interval) {
    for(int i = 0; i < dnames.length; i++) {
     int index = order[i];
      fore.beginDraw();
      //Draw the vertical line for the axis
      fore.stroke(0);
      fore.line(x, pixelHeight * margin, x, pixelHeight * (1- margin));
      
      fore.fill(0);
      fore.textAlign(CENTER);
      
      fore.textFont(bold, 12);
      //label it at the top
      fore.text(dnames[index], x, pixelHeight * margin - 15);
      
      fore.textFont(std, 12);
      //Change this to use text ascent
      //Check the oreintation before lableing the max and min
      // Draws an axis in the foreground
      if (orient[index]) { 
        fore.text(max[index], x, pixelHeight * margin - 3);
        if (i == 0) {
          fore.textAlign(LEFT, TOP);
        } else {
            fore.textAlign(CENTER, TOP);
        }        fore.text(min[index], x, pixelHeight * (1-margin) + 3);
      } else {
        fore.text(min[index], x, pixelHeight * margin - 3);
        if (i == 0) {
          fore.textAlign(LEFT, TOP);
        } else {
            fore.textAlign(CENTER, TOP);
        }
        fore.text(max[index], x, pixelHeight * (1-margin) + 3);
      }
      fore.endDraw();
      
      //draw the button in the ineract canvas
      interact.beginDraw();
      interact.fill(c[index]);
      interact.rectMode(CENTER);
      interact.rect(x, pixelHeight/2, 10, pixelHeight* (1-2*margin)+ 1); //CHANGE THE WIDTH
      interact.endDraw();
      x+= interval;
    
    }

    
 }
 
 //ANIMATED TRANSITIONS COULD BE DONE WITH REORDERING RATHER THAN SWAPPING
 
 public void select() {
    for (int i = 0; i < dnames.length; i++) {
      if (buttonHovered(i)) {
        select = order[i];
        updateBack();
      }
    }
 }
 
  public int checkClicks() {
    for (int i = 0; i < dnames.length; i++) {
      if (buttonHovered(i)) {
        return i;
      }
    }
    return -1;
 }
 
 // response fora double click event
 public void flip() {
    for (int i = 0; i < dnames.length; i++) {
      if (buttonHovered(i)) {
        orient[order[i]] = !orient[order[i]];
        updateBack();
        return;
      }
    }
 }
  //checks if an axis is hovered
  private boolean buttonHovered(int index) {
    interact.beginDraw();
    boolean ret = interact.get(mouseX, mouseY) == c[order[index]];
    interact.endDraw();
    return ret;
  }
  
  
  //FIX MOVE AXIS  ANIMATE IT CHOOSE BETTER COLORS
  public void moveAxis(int start, float endX) {
     float interval = pixelWidth * (1 - 2*margin) / (dnames.length -1); // interval is dependent on dimensions displayed
     int end = max(0, (int) round((endX - pixelWidth * margin) / interval));
     while(start != end) {
       //println ("Swapping " + start + " with " + end);
       if (end < start) {
         swap(start, start - 1);
         start--;
       } else {
         swap(start, start + 1);
         start++;
       }
     }
     updateBack();
  }
  
  private void swap(int i, int j) {
    int temp = order[i];
     order[i] = order[j];
     order[j] = temp;
  }
 
 // function for updating canvas size in all dimensions
 public void resetCanvas() {
    fore = createGraphics(pixelWidth, pixelHeight);
    interact = createGraphics(pixelWidth, pixelHeight);
    back = createGraphics(pixelWidth, pixelHeight);
    updateBack();
 }

}