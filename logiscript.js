document.addEventListener('contextmenu', event => event.preventDefault());
window.onresize = windowResized;


const NOT = "1";
const AND = "&";
const OR  = "≥1";
const XOR = "=1";

const bg_color = '#c0c0c0';
const grid_dot_color = '#000000';
const gate_color = '#d3d3d3';
const gate_stroke_color = '#000000';
const hover_color = '#a0a0a0';
const grab_color = '#707070';
const undefined_color = '#808080';
const low_color = '#000000';
const high_color = '#00FF00';


const groups = {
	wire: 0,
	gate: 1
}

const types = {
	not: 0,
	and: 1,
	or:  2,
	xor: 3
}


var grid_start_x = 0;
var grid_start_y = 0;
var grid_size_x = 1000;
var grid_size_y = 1000;
var grid_distance = 25;
var grid_dot_size = 2;
var grabbed;
var hover;
var wired;
var objects = [];
var corner_radius = 2;
var trans_x = 0;
var trans_y = 0;
var zoom = 0;
var grid_distance_min = 10;
var grid_distance_max = 50;
var max_inputs = 16;
var grab_tolerance = 2;
var selected = 0;


class Obj
{
	constructor(x,y,w,h,group,type,inv,stat,erase,spec_1,spec_2)
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.group = group;
		this.type = type;
		this.inv = inv;
		this.stat = stat;
		this.erase = erase;
		this.spec_1 = spec_1;
		this.spec_2 = spec_2;
	}

	draw()
	{
		switch(this.group)
		{
			case groups.gate:
				stroke(gate_stroke_color);
				strokeWeight(grid_distance/5);
				rect(this.x, this.y, this.w, this.h, corner_radius);
				fill(0);
				
				stroke(gate_color);
				textSize(grid_distance);
				textFont('Arial');
				textStyle(BOLD);
				textAlign(CENTER, CENTER);
				switch(this.type)
				{
					case types.not:
						text(NOT, this.x+(this.w/2), this.y+(this.h/2));
						break;
						
					case types.and:
						text(AND, this.x+(this.w/2), this.y+(this.h/2));
						break;
						
					case types.or:
						text(OR, this.x+(this.w/2), this.y+(this.h/2));
						break;
					
					case types.xor:
						text(XOR, this.x+(this.w/2), this.y+(this.h/2));
						break;
					
					default:
					
						break;
				}
				
				var binary = dec2bin(this.inv);
				stroke(undefined_color);
				strokeWeight(grid_distance/5);
				line(this.x+this.w+(grid_distance/5), this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				if(binary[0]=='1')
				{
					stroke(gate_stroke_color);
					circle(this.x+this.w, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, grid_distance/2);
				}
				for(var i=1; i<this.h/grid_distance; i++)
				{
					stroke(undefined_color);
					strokeWeight(grid_distance/5);
					
					line(this.x-grid_distance, this.y+(i*grid_distance), this.x-(grid_distance/5), this.y+(i*grid_distance));
					
					if(i-1<binary.length && binary[binary.length-i]=='1')
					{
						stroke(gate_stroke_color);
						circle(this.x, this.y+(i*grid_distance), grid_distance/2);
					}
				}
				
				stroke(undefined_color);
				strokeWeight(grid_distance/5);
				fill(undefined_color);
				for(let o of objects)
				{
					if(o!=this && o.group==groups.gate)
					{
						if(this.x+this.w+grid_distance == o.x-grid_distance && (o.y<this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2 && o.y+o.h>this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2))
						{
							circle(this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, grid_distance/4);
						}
					}
				}
				break;
			
			case groups.wire:
				stroke(undefined_color);
				strokeWeight(grid_distance/5);
				if(this.spec_1 == 1)
				{
					line(this.x, this.y, mouseX, mouseY);
				}
				else
				{
					fill(undefined_color);
					line(this.x, this.y, this.x+this.w, this.y+this.h);
					for(let o of objects)
					{
						if(o!=this)
						{
							if((o.x==this.x && o.y==this.y) || (o.x+o.w==this.x && o.y+o.h==this.y))
							{
								circle(this.x, this.y, grid_distance/4);
							}
							if((o.x==this.x+this.w && o.y==this.y+this.h) || (o.x+o.w==this.x+this.w && o.y+o.h==this.y+this.h))
							{
								circle(this.x+this.w, this.y+this.h, grid_distance/4);
							}
							if(o.x-grid_distance==this.x && (this.y>o.y && this.y<(o.y+o.h)))
							{
								circle(this.x, this.y, grid_distance/4);
							}
							if(o.x-grid_distance==this.x+this.w && (this.y+this.h>o.y && this.y+this.h<(o.y+o.h)))
							{
								circle(this.x+this.w, this.y+this.h, grid_distance/4);
							}
							if(o.x+o.w+grid_distance==this.x && this.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
							{
								circle(this.x, this.y, grid_distance/4);
							}
							if(o.x+o.w+grid_distance==this.x+this.w && this.y+this.h==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
							{
								circle(this.x+this.w, this.y+this.h, grid_distance/4);
							}
						}
					}
				}
				break;
			
			default:
			
				break;
		}
	}
}


function setup()
{
	createCanvas(document.getElementById('div_simulation').clientWidth, document.getElementById('div_simulation').clientHeight);
	grid_size_x = document.getElementById('div_simulation').clientWidth;
	grid_size_y = document.getElementById('div_simulation').clientHeight;
	
	p5.disableFriendlyErrors = true;
	frameRate(24);
	
	strokeCap(PROJECT);
}

function windowResized()
{
	resizeCanvas(25, 25);
	resizeCanvas(document.getElementById('div_simulation').clientWidth, document.getElementById('div_simulation').clientHeight);
	grid_size_x = document.getElementById('div_simulation').clientWidth;
	grid_size_y = document.getElementById('div_simulation').clientHeight;
}

function draw()
{
	background(bg_color);
	grid();
	
	for(var i=0; i<objects.length; i++)
	{
		objects[i].draw();
	}
	
	m = createVector(mouseX, mouseY);
	hover = null;
	for(let o of objects)
	{
		if(o.group==groups.gate && m.x>o.x-grab_tolerance*(grid_distance/5) && m.x<o.x+o.w+grab_tolerance*(grid_distance/5) && m.y>o.y-grab_tolerance*(grid_distance/5) && m.y<o.y+o.h+grab_tolerance*(grid_distance/5))
		{
			hover = o;
		}
		else if(o.group==groups.wire)
		{
			v = createVector(o.x, o.y);
			for(i=0; i<100; i++)
			{
				v.add(o.w/100, o.h/100);
				if(p5.Vector.dist(m, v)<grab_tolerance*(grid_distance/5))
				{
					hover = o;
				}
			}
		}
	}
	noStroke();
	if(hover && (selected!=1 || hover.group!=groups.wire))
	{
		cursor('grab');
	}
	else
	{
		cursor(ARROW);
	}
	for(let o of objects)
	{
		if(o == grabbed)
		{
			fill(grab_color);
		}
		else if(o == hover)
		{
			fill(hover_color);
		}
		else
		{
			fill(gate_color);
		}
		o.draw();
	}
}

function mousePressed()
{
	var not_flag = 0;
	if(hover)
	{
		if(mouseButton == LEFT)
		{
			if(hover.group==groups.gate)
			{
				for(var i=1; i<hover.h/grid_distance; i++)
				{
					var v = createVector(hover.x, hover.y+(i*grid_distance));
					if(p5.Vector.dist(m, v)<grid_distance/2)
					{
						not_flag = 1;
						var binary = dec2bin(hover.inv);
						if(binary[binary.length-i]=='1')
						{
							hover.inv -= pow(2, i-1);
						}
						else
						{
							hover.inv += pow(2, i-1);
						}
					}
				}
				
				v = createVector(hover.x+hover.w, hover.y+hover.h/2-((hover.h/grid_distance)%2)*grid_distance/2);
				if(p5.Vector.dist(m, v)<grid_distance/2)
				{
					not_flag = 1;
					var binary = dec2bin(hover.inv);
					if(binary[0]=='1')
					{
						hover.inv -= pow(2, max_inputs+1);
					}
					else
					{
						hover.inv += pow(2, max_inputs+1);
					}
				}
			}
			
			if(not_flag == 0 && (selected!=1 || hover.group!=groups.wire))
			{
				grabbed = hover;
			}
		}
		else
		{
			objects.splice(objects.indexOf(hover), 1);
		}
	}
	
	if(selected==1 && mouseButton==LEFT && grabbed==null && not_flag==0)
	{
		if(m.x>0 && m.y>0 && m.x<width && m.y<height)
		{
			if(wired)
			{
				wired.spec_1 = 0;
				wired.w = round((m.x-wired.x)/grid_distance)*grid_distance;
				wired.h = round((m.y-wired.y)/grid_distance)*grid_distance;
				if(wired.w==0 && wired.h==0)
				{
					objects.pop();
				}
				wired = null;
			}
			else
			{
				wired = new Obj(round(m.x/grid_distance)*grid_distance, round(m.y/grid_distance)*grid_distance, 0, 0, groups.wire,0,0,0,0,1,0);
				objects.push(wired);
			}
		}
	}
	
	if(mouseButton == RIGHT && wired)
	{
		objects.pop();
		wired = null;
	}
}

function mouseReleased()
{
	grabbed.x = round(grabbed.x/grid_distance)*grid_distance;
	grabbed.y = round(grabbed.y/grid_distance)*grid_distance;
	grabbed.draw();
	grabbed = null;
}

function mouseDragged()
{
	if (grabbed)
	{
		grabbed.x += movedX;
		grabbed.y += movedY;
	}
}

function keyPressed()
{
	if(hover)
	{
		if(keyCode == DELETE)
		{
			objects.splice(objects.indexOf(hover), 1);
		}
	}
	
	switch(keyCode)
	{
		case UP_ARROW:
			translate_func(0, 2);
			break;
			
		case DOWN_ARROW:
			translate_func(0, -2);
			break;
			
		case LEFT_ARROW:
			translate_func(2, 0);
			break;
			
		case RIGHT_ARROW:
			translate_func(-2, 0);
			break;
			
		case ESCAPE:
			if(wired)
			{
				objects.pop();
				wired = null;
			}
		
		default:
			break;
	}
}

function keyTyped()
{
	switch(key)
	{
		case 'n':
			newGate(types.not);
			break;
		
		case 'a':
			newGate(types.and);
			break;
		
		case 'o':
			newGate(types.or);
			break;
			
		case 'x':
			newGate(types.xor);
			break;
			
		case 'c':
			sel(0);
			break;
			
		case 'w':
			sel(1);
			break;
		
		default:
			break;
	}
}

function grid() {
    fill(grid_dot_color);
	noStroke();
    for (y=grid_start_y+grid_distance; y<grid_size_y+grid_start_y; y+=grid_distance)
	{
		for (var x=grid_start_x+grid_distance; x<grid_size_x+grid_start_x; x+=grid_distance)
		{
			circle(x, y, grid_dot_size);
		}
    }
 }

function zoom_func(dir)
{
	grid_distance += 5*dir;
	if(grid_distance > grid_distance_max)
	{
		grid_distance = grid_distance_max;
	}
	else if(grid_distance < grid_distance_min)
	{
		grid_distance = grid_distance_min;
	}
	else
	{
		zoom += dir;
		for(let o of objects)
		{
			o.x = o.x/(grid_distance-5*dir)*grid_distance;
			o.y = o.y/(grid_distance-5*dir)*grid_distance;
			o.w = o.w/(grid_distance-5*dir)*grid_distance;
			o.h = o.h/(grid_distance-5*dir)*grid_distance;
		}
	}
}

function translate_func(x, y)
{
	trans_x -= x*grid_distance;
	trans_y -= y*grid_distance;
	
	for(let o of objects)
	{
		o.x -= x*grid_distance;
		o.y -= y*grid_distance;
	}
}

function view_fit()
{	
	var o_x_min = objects[0];
	var o_y_min = objects[0];
	var o_x_max = objects[0];
	var o_y_max = objects[0];
	
	for(let o of objects)
	{
		if(o.x < o_x_min.x)
		{
			o_x_min = o;
		}
		if(o.x > o_x_max.x)
		{
			o_x_max = o;
		}
		if(o.y < o_y_min.y)
		{
			o_y_min = o;
		}
		if(o.y > o_y_max.y)
		{
			o_y_max = o;
		}
	}
	
	while(o_x_min.x < 2*grid_distance)
	{
		translate_func(-1,0);
	}
	while(o_y_min.y < grid_distance)
	{
		translate_func(0,-1);
	}
	while(o_x_min.x > 2*grid_distance)
	{
		translate_func(1,0);
	}
	while(o_y_min.y > grid_distance)
	{
		translate_func(0,1);
	}
	
	while(o_x_max.x+o_x_max.w < width && o_y_max.y+o_y_max.h < height && grid_distance < grid_distance_max)
	{
		zoom_func(1);
	}
	while((o_x_max.x+o_x_max.w > width-grid_distance || o_y_max.y+o_y_max.h > height-grid_distance) && grid_distance > grid_distance_min)
	{
		zoom_func(-1);
	}
}

function dec2bin(dec)
{
	var binary = (dec >>> 0).toString(2)
	binary = binary.padStart(max_inputs+1, '0');
	return binary;
}

function newGate(type)
{
	var inputs = 1;
	var inv = 0;
	
	if(type != types.not)
	{
		while(!(inputs = +(prompt("Anzahl der Eingänge:"))) || inputs < 2 || inputs > max_inputs)
		{
			if(inputs == 0)
			{
				return;
			}
			else
			{
				alert("Bitte geben Sie nur Zahlen [2;"+max_inputs+"] ein!");
			}
		}
	}
	else
	{
		inv = pow(2,max_inputs+1);
	}
	
	objects.push(new Obj(round((random(width/2))/grid_distance+2)*grid_distance, round((random(height/2))/grid_distance+2)*grid_distance, 2*grid_distance, (inputs+1)*grid_distance, groups.gate,type,inv,0,0,0,0));
}

function sel(item)
{
	selected = item;
	switch(item)
	{
		case 0:
			(document.getElementsByClassName("button_cursor"))[0].style.borderStyle = "inset";
			(document.getElementsByClassName("button_wire"))[0].style.borderStyle = "outset";
			break;
			
		case 1:
			(document.getElementsByClassName("button_cursor"))[0].style.borderStyle = "outset";
			(document.getElementsByClassName("button_wire"))[0].style.borderStyle = "inset";
			break;
			
		default:
		
			break;
	}
}

function load_circuit()
{
	alert("Laden einer Schaltung aus Textdatei");
}

function save_circuit()
{
	alert("Speichern einer Schaltung in Textdatei");
}

function manual()
{
	alert("Simulator-Handbuch");
}

function task()
{
	alert("Aufgabenstellung");
}

function check()
{
	alert("Schaltung überprüfen");
}

function LogiScript()
{
	if(document.getElementById('LogiScript').innerHTML == "LogiScript")
	{
		document.getElementById('LogiScript').innerHTML = "(in Anlehnung an LogiFlash&copy)";
	}
	else
	{
		document.getElementById('LogiScript').innerHTML = "LogiScript";
	}		
}

function Gernot()
{
	if(document.getElementById('Gernot').innerHTML == "Gernot Polivka")
	{
		document.getElementById('Gernot').innerHTML = "gernot.polivka@gmail.com";
	}
	else
	{
		document.getElementById('Gernot').innerHTML = "Gernot Polivka";
	}		
}