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
	gate: 1,
	input: 2,
	output: 3,
	fixed: 4
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
var connections = [];
var corner_radius = 2;
var trans_x = 0;
var trans_y = 0;
var zoom = 0;
var grid_distance_min = 10;
var grid_distance_max = 50;
var max_inputs = 16;
var grab_tolerance = 2;
var selected = 0;
var shortcircuitflag = 0;
var max_iterations = 10000;


class Obj
{
	//wire:		spec_1 = wired		spec_2 = ###
	//gate:		spec_1 = ###		spec_2 = ###
	//input:	spec_1 = label		spec_2 = ###
	//output:	spec_1 = label		spec_2 = ###
	//fixed:	spec_1 = ###		spec_2 = ###
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
				switch(this.stat)
				{
					case 0:
						stroke(low_color);
						break;
						
					case 1:
						stroke(high_color);
						break;
						
					case 2:
						stroke(undefined_color);
						break;
						
					default:
					
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+this.w+(grid_distance/5), this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				if(binary[0]=='1')
				{
					stroke(gate_stroke_color);
					circle(this.x+this.w, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, grid_distance/2);
				}
				for(var i=1; i<this.h/grid_distance; i++)
				{
					let stat = 2;
					for(let c of connections)
					{
						if(c.x==this.x-grid_distance && c.y==this.y+(i*grid_distance))
						{
							stat = c.stat;
						}
					}
					switch(stat)
					{
						case 0:
							stroke(low_color);
							break;
							
						case 1:
							stroke(high_color);
							break;
							
						case 2:
							stroke(undefined_color);
							break;
							
						default:
						
							break;
					}
					strokeWeight(grid_distance/5);
					
					line(this.x-grid_distance, this.y+(i*grid_distance), this.x-(grid_distance/5), this.y+(i*grid_distance));
					
					if(i-1<binary.length && binary[binary.length-i]=='1')
					{
						stroke(gate_stroke_color);
						circle(this.x, this.y+(i*grid_distance), grid_distance/2);
					}
				}
				break;
			
			case groups.wire:
				switch(this.stat)
				{
					case 0:
						stroke(low_color);
						break;
						
					case 1:
						stroke(high_color);
						break;
						
					case 2:
						stroke(undefined_color);
						break;
						
					default:
					
						break;
				}
				strokeWeight(grid_distance/5);
				if(this.spec_1 == 1)
				{
					line(this.x, this.y, mouseX, mouseY);
				}
				else
				{
					line(this.x, this.y, this.x+this.w, this.y+this.h);
				}
				break;
				
			case groups.input:
				stroke(gate_stroke_color);
				strokeWeight(grid_distance/5);
				rect(this.x, this.y, this.w, this.h, corner_radius);
				stroke(grab_color);
				strokeWeight(grid_distance/10);
				rect(this.x+grid_distance/10, this.y+grid_distance/10, this.w-grid_distance/5, this.h-grid_distance/5);
				fill(0);
				
				stroke(gate_color);
				textSize(grid_distance);
				textFont('Arial');
				textStyle(BOLD);
				textAlign(RIGHT, CENTER);
				if(this.spec_1>=10)
				{
					text("E", this.x+(this.w/2)+grid_distance/8, this.y+(this.h/2));
					textSize(grid_distance/2);
					textAlign(LEFT, CENTER);
					text(this.spec_1, this.x+(this.w/2)+grid_distance/8, this.y+(this.h/2)+grid_distance/2);
				}
				else
				{
					text("E", this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2));
					textSize(grid_distance/2);
					textAlign(LEFT, CENTER);
					text(this.spec_1, this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2)+grid_distance/2);

				}
				
				switch(this.stat)
				{
					case 0:
						stroke(low_color);
						break;
						
					case 1:
						stroke(high_color);
						break;
						
					case 2:
						stroke(undefined_color);
						break;
						
					default:
					
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+this.w+(grid_distance/5), this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				break;
				
			case groups.output:
				stroke(gate_stroke_color);
				strokeWeight(grid_distance/5);
				if(this.stat==1)
				{
					fill(high_color);
				}
				else
				{
					fill(low_color);
				}
				rect(this.x, this.y, this.w, this.h, corner_radius);
				fill(0);
				
				stroke(gate_color);
				textSize(grid_distance);
				textFont('Arial');
				textStyle(BOLD);
				textAlign(RIGHT, CENTER);
				if(this.spec_1>=10)
				{
					text("A", this.x+(this.w/2)+grid_distance/8, this.y+(this.h/2));
					textSize(grid_distance/2);
					textAlign(LEFT, CENTER);
					text(this.spec_1, this.x+(this.w/2)+grid_distance/8, this.y+(this.h/2)+grid_distance/2);
				}
				else
				{
					text("A", this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2));
					textSize(grid_distance/2);
					textAlign(LEFT, CENTER);
					text(this.spec_1, this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2)+grid_distance/2);
				}
				
				switch(this.stat)
				{
					case 0:
						stroke(low_color);
						break;
						
					case 1:
						stroke(high_color);
						break;
						
					case 2:
						stroke(undefined_color);
						break;
						
					default:
					
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x-(grid_distance/5), this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x-grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				break;
				
			case groups.fixed:
				fill(0);
				stroke(gate_color);
				textSize(grid_distance);
				textFont('Arial');
				textStyle(BOLD);
				textAlign(CENTER, CENTER);
				text(this.stat, this.x, this.y);
				
				switch(this.stat)
				{
					case 0:
						stroke(low_color);
						break;
						
					case 1:
						stroke(high_color);
						break;
						
					case 2:
						stroke(undefined_color);
						break;
						
					default:
					
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+grid_distance/2, this.y, this.x+grid_distance, this.y);
				break;
			
			default:
			
				break;
		}
		draw_connections();
	}
	
	analyse(connection)
	{
		var binary = dec2bin(this.inv);
		var undef = 0;
		var inputs = [];
		if(this.type!=types.not)
		{
			for(var i=1; i<this.h/grid_distance; i++)
			{
				for(let c of connections)
				{
					if(c.x==this.x-grid_distance && c.y==this.y+(i*grid_distance))
					{
						if(c.done==1 && c.stat!=2)
						{
							inputs.push(c.stat);
						}
						else
						{
							undef = 1;
							break;
						}
					}
				}
			}
		}
		var sum = 0;
		for(var i=1; i<this.h/grid_distance; i++)
		{
			if(i-1<binary.length && binary[binary.length-i]=='1')
			{
				inputs[i-1] = 1-inputs[i-1];
			}
			if(!isNaN(inputs[i-1]))
			{
				sum += inputs[i-1];
			}
		}
		
		switch(this.type)
		{
			case types.not:
				if(binary[0] != binary[binary.length-1])
				{
					this.stat = 1-connection.stat;
				}
				else
				{
					this.stat = connection.stat;
				}
				break;
				
			case types.and:
				if(sum<inputs.length)
				{
					this.stat = 0+parseInt(binary[0]);
				}
				else if(inputs.length<this.h/grid_distance-1 || undef==1)
				{
					this.stat = 2;
				}
				else
				{
					this.stat = 1-parseInt(binary[0]);
				}
				break;
				
			case types.or:
				if(sum>0)
				{
					this.stat = 1-parseInt(binary[0]);
				}
				else if(inputs.length<this.h/grid_distance-1 || undef==1)
				{
					this.stat = 2;
				}
				else
				{
					this.stat = 0+parseInt(binary[0]);
				}
				break;
				
			case types.xor:
				if(inputs.length<this.h/grid_distance-1 || undef==1)
				{
					this.stat = 2;
				}
				else
				{
					if(sum%2>0)
					{
						this.stat = 1-parseInt(binary[0]);
					}
					else
					{
						this.stat = 0+parseInt(binary[0]);
					}
				}
				break;
				
			default:
			
				break;
		}
	}
}

class Con
{
	constructor(x,y,obj_list=[],stat,done,start_obj)
	{
		this.x = x;
		this.y = y;
		this.obj_list = obj_list;
		this.stat = stat;
		this.done = done;
		this.start_obj = start_obj;
	}
	
	draw()
	{
		circle(this.x, this.y, grid_distance/4);
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
		if(o.group==groups.gate || o.group==groups.input || o.group==groups.output)
		{
			if(m.x>o.x-grab_tolerance*(grid_distance/5) && m.x<o.x+o.w+grab_tolerance*(grid_distance/5) && m.y>o.y-grab_tolerance*(grid_distance/5) && m.y<o.y+o.h+grab_tolerance*(grid_distance/5))
			{
				hover = o;
			}
		}
		else if(o.group==groups.wire)
		{
			let tolerance = grab_tolerance*(grid_distance/5);
			let b = createVector(o.x+o.w, o.y+o.h);
			
			if(pow(2*b.y*m.y-2*o.y*m.y+2*b.x*m.x-2*o.x*m.x-2*o.y*b.y-2*o.x*b.x+2*pow(o.y,2)+2*pow(o.x,2),2)-4*(pow(b.y,2)-2*o.y*b.y+pow(b.x,2)-2*o.x*b.x+pow(o.y,2)+pow(o.x,2))*(-pow(tolerance,2)+pow(m.y,2)-2*o.y*m.y+pow(m.x,2)-2*o.x*m.x+pow(o.y,2)+pow(o.x,2))>=0 && m.x>=min(o.x,b.x)-tolerance && m.x<=max(o.x,b.x)+tolerance && m.y>=min(o.y,b.y)-tolerance && m.y<=max(o.y,b.y)+tolerance)
			{
				hover = o;
			}
		}
		else if(o.group==groups.fixed)
		{
			if(m.x>o.x-grid_distance/2 && m.x<o.x+grid_distance/2 && m.y>o.y-grid_distance/2 && m.y<o.y+grid_distance/2)
			{
				hover = o;
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

function update_connections()
{
	connections.length = 0;
	var found = 0;
	var exists_p = 0;
	var exists_o = 0;
	for(let o of objects)
	{
		switch(o.group)
		{
			case groups.gate:
				for(let p of objects)
				{
					if(p.group==groups.gate && p!=o)
					{
						if(o.x+o.w+grid_distance == p.x-grid_distance && (p.y<o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2 && p.y+p.h>o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2))
						{
							found = 0;
							for(let c of connections)
							{
								if(c.x==o.x+o.w+grid_distance && c.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
								{
									exists_p = 0;
									exists_o = 0;
									for(let d of c.obj_list)
									{
										if(d==o)
										{
											exists_o = 1;
										}
										else if(d==p)
										{
											exists_p = 1;
										}
									}
									
									if(exists_p==0)
									{
										c.obj_list.push(p);
									}
									if(exists_o==0)
									{
										c.obj_list.push(o);
									}
									found = 1;
								}
							}
							if(found==0)
							{
								new_Con = new Con(o.x+o.w+grid_distance, o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2);
								new_Con.obj_list.push(o);
								new_Con.obj_list.push(p);
								connections.push(new_Con);
							}
						}
					}
				}
				break;
			
			case groups.wire:
				if(o.spec_1 == 1)
				{
					line(o.x, o.y, mouseX, mouseY);
				}
				else
				{
					for(let p of objects)
					{
						if(p!=o)
						{
							if(p.group==groups.wire)
							{
								if((p.x==o.x && p.y==o.y) || (p.x+p.w==o.x && p.y+p.h==o.y))
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x && c.y==o.y)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x, o.y);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
								if((p.x==o.x+o.w && p.y==o.y+o.h) || (p.x+p.w==o.x+o.w && p.y+p.h==o.y+o.h))
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x+o.w && c.y==o.y+o.h)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x+o.w, o.y+o.h);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
							}
							else if(p.group==groups.gate || p.group==groups.input || p.group==groups.output)
							{
								if(p.x-grid_distance==o.x && (o.y>p.y && o.y<(p.y+p.h)) && p.group!=groups.input)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x && c.y==o.y)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x, o.y);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
								if(p.x-grid_distance==o.x+o.w && (o.y+o.h>p.y && o.y+o.h<(p.y+p.h)) && p.group!=groups.input)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x+o.w && c.y==o.y+o.h)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x+o.w, o.y+o.h);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
								if(p.x+p.w+grid_distance==o.x && o.y==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2 && p.group!=groups.output)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x && c.y==o.y)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x, o.y);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
								if(p.x+p.w+grid_distance==o.x+o.w && o.y+o.h==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2 && p.group!=groups.output)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x+o.w && c.y==o.y+o.h)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x+o.w, o.y+o.h);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
							}
							else if(p.group==groups.fixed)
							{
								if(p.x+grid_distance==o.x && p.y==o.y)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x && c.y==o.y)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x, o.y);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
								if(p.x+grid_distance==o.x+o.w && p.y==o.y+o.h)
								{
									found = 0;
									for(let c of connections)
									{
										if(c.x==o.x+o.w && c.y==o.y+o.h)
										{
											exists_p = 0;
											exists_o = 0;
											for(let d of c.obj_list)
											{
												if(d==o)
												{
													exists_o = 1;
												}
												else if(d==p)
												{
													exists_p = 1;
												}
											}
											
											if(exists_p==0)
											{
												c.obj_list.push(p);
											}
											if(exists_o==0)
											{
												c.obj_list.push(o);
											}
											found = 1;
										}
									}
									if(found==0)
									{
										new_Con = new Con(o.x+o.w, o.y+o.h);
										new_Con.obj_list.push(o);
										new_Con.obj_list.push(p);
										connections.push(new_Con);
									}
								}
							}
						}
					}
				}
				break;
				
			case groups.input:
				for(let p of objects)
				{
					if(p!=o && p.group==groups.gate)
					{
						if(o.x+o.w+grid_distance == p.x-grid_distance && (p.y<o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2 && p.y+p.h>o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2))
						{
							found = 0;
							for(let c of connections)
							{
								if(c.x==o.x+o.w+grid_distance && c.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
								{
									exists_p = 0;
									exists_o = 0;
									for(let d of c.obj_list)
									{
										if(d==o)
										{
											exists_o = 1;
										}
										else if(d==p)
										{
											exists_p = 1;
										}
									}
									
									if(exists_p==0)
									{
										c.obj_list.push(p);
									}
									if(exists_o==0)
									{
										c.obj_list.push(o);
									}
									found = 1;
								}
							}
							if(found==0)
							{
								new_Con = new Con(o.x+o.w+grid_distance, o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2);
								new_Con.obj_list.push(o);
								new_Con.obj_list.push(p);
								connections.push(new_Con);
							}
						}
					}
				}
				break;
				
			case groups.output:
				for(let p of objects)
				{
					if((p.group==groups.gate || p.group==groups.input) && p!=o)
					{
						if(o.x-grid_distance==p.x+p.w+grid_distance && o.y+grid_distance==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2)
						{
							found = 0;
							for(let c of connections)
							{
								if(c.x==o.x-grid_distance && c.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
								{
									exists_p = 0;
									exists_o = 0;
									for(let d of c.obj_list)
									{
										if(d==o)
										{
											exists_o = 1;
										}
										else if(d==p)
										{
											exists_p = 1;
										}
									}
									
									if(exists_p==0)
									{
										c.obj_list.push(p);
									}
									if(exists_o==0)
									{
										c.obj_list.push(o);
									}
									found = 1;
								}
							}
							if(found==0)
							{
								new_Con = new Con(o.x-grid_distance, o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2);
								new_Con.obj_list.push(o);
								new_Con.obj_list.push(p);
								connections.push(new_Con);
							}
						}
					}
				}
				break;
				
			case groups.fixed:
				for(let p of objects)
				{
					if((p.group==groups.gate || p.group==groups.output || p.group==groups.fixed) && p!=o)
					{
						if(o.x+grid_distance==p.x-grid_distance && (o.y>p.y && o.y<(p.y+p.h)))
						{
							found = 0;
							for(let c of connections)
							{
								if(c.x==o.x+grid_distance && c.y==o.y)
								{
									exists_p = 0;
									exists_o = 0;
									for(let d of c.obj_list)
									{
										if(d==o)
										{
											exists_o = 1;
										}
										else if(d==p)
										{
											exists_p = 1;
										}
									}
									
									if(exists_p==0)
									{
										c.obj_list.push(p);
									}
									if(exists_o==0)
									{
										c.obj_list.push(o);
									}
									found = 1;
								}
							}
							if(found==0)
							{
								new_Con = new Con(o.x+grid_distance, o.y);
								new_Con.obj_list.push(o);
								new_Con.obj_list.push(p);
								connections.push(new_Con);
							}
						}
					}
				}
				break;
				
			default:
			
				break;
		}
	}
	analyse();
}

function draw_connections()
{
	strokeWeight(grid_distance/5);
	for(let c of connections)
	{
		switch(c.stat)
		{
			case 0:
				stroke(low_color);
				fill(low_color);
				break;
				
			case 1:
				stroke(high_color);
				fill(high_color);
				break;
				
			case 2:
				stroke(undefined_color);
				fill(undefined_color);
				break;
				
			default:
			
				break;
		}
		circle(c.x, c.y, grid_distance/4);
	}
}

function analyse()
{
	var cycle_0 = [];
	var cycle_1 = [];
	for(let c of connections)
	{
		c.stat = 2;
		c.done = 0;
	}
	
	for(let c of connections)
	{
		let shortcircuit = 0;
		for(let d of c.obj_list)
		{
			if(d.group==groups.input || d.group==groups.fixed)
			{
				if(shortcircuit>0)
				{
					if(shortcircuitflag==0)
					{
						shortcircuitflag = 1;
						alert("Kurzschluss!");
						document.getElementById("alarm").style.visibility = "visible";
					}
					return;
				}
				c.stat = d.stat;
				c.done = 1;
				c.start_obj = d;
				cycle_0.push(c);
				shortcircuit++;
			}
		}
	}
	
	while(cycle_0.length>0)
	{
		for(let c of cycle_0)
		{
			for(let o of c.obj_list)
			{
				if(o.group==groups.output)
				{
					o.stat = c.stat;
				}
				else if(o.group==groups.wire && o!=c.start_obj)
				{
					o.stat = c.stat;
					for(let d of connections)
					{
						if(((o.x==d.x && o.y==d.y)||(o.x+o.w==d.x && o.y+o.h==d.y)) && c!=d)
						{
							d.stat = c.stat;
							d.start_obj = o;
							d.done++;
							if(d.done>max_iterations)
							{
								if(shortcircuitflag==0)
								{
									shortcircuitflag = 1;
									alert("Instabile Schaltung!");
									document.getElementById("alarm").style.visibility = "visible";
								}
								return;
							}
							cycle_1.push(d);
						}
					}
				}
				else if(o.group==groups.gate && o!=c.start_obj)
				{
					if(c.x>o.x)
					{
						if(shortcircuitflag==0)
						{
							shortcircuitflag = 1;
							alert("Kurzschluss!");
							document.getElementById("alarm").style.visibility = "visible";
						}
						return;
					}
					let old_stat = o.stat;
					o.analyse(c);
					for(let d of connections)
					{
						if(d.x==o.x+o.w+grid_distance && d.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
						{
							if(o.stat!=old_stat)
							{
								d.stat = o.stat;
								d.start_obj = o;
								d.done++;
								if(d.done>max_iterations)
								{
									if(shortcircuitflag==0)
									{
										shortcircuitflag = 1;
										alert("Instabile Schaltung!");
										document.getElementById("alarm").style.visibility = "visible";
									}
									return;
								}
								cycle_1.push(d);
							}
						}
					}
				}
				else if((o.group==groups.input || o.group==groups.fixed) && o!=c.start_obj)
				{
					if(shortcircuitflag==0)
					{
						shortcircuitflag = 1;
						alert("Kurzschluss oder Leiterschleife!");
						document.getElementById("alarm").style.visibility = "visible";
					}
					return;
				}
			}
		}
		cycle_0.length = 0;
		cycle_0.push.apply(cycle_0, cycle_1);
		cycle_1.length = 0;
	}
	
	for(let c of connections)
	{
		if(c.done==0)
		{
			c.stat = 2;
			for(d of c.obj_list)
			{
				d.stat = 2;
			}
		}
	}
	
	if(shortcircuitflag==1)
	{
		shortcircuitflag = 0;
		//alert("Kurzschluss behoben!");
		document.getElementById("alarm").style.visibility = "hidden";
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
				wired = new Obj(round(m.x/grid_distance)*grid_distance, round(m.y/grid_distance)*grid_distance, 0, 0, groups.wire,0,0,2,0,1,0);
				objects.push(wired);
			}
		}
	}
	
	if(mouseButton == RIGHT && wired)
	{
		objects.pop();
		wired = null;
	}
	update_connections();
}

function mouseReleased()
{
	if(grabbed)
	{
		if((grabbed.group==groups.input || grabbed.group==groups.fixed) && grabbed.x==round(grabbed.x/grid_distance)*grid_distance && grabbed.y==round(grabbed.y/grid_distance)*grid_distance)
		{
			if(grabbed.stat==0)
			{
				grabbed.stat = 1;
			}
			else
			{
				grabbed.stat = 0;
			}
		}
		grabbed.x = round(grabbed.x/grid_distance)*grid_distance;
		grabbed.y = round(grabbed.y/grid_distance)*grid_distance;
		grabbed.draw();
		grabbed = null;
		update_connections();
	}
}

function mouseDragged()
{
	if (grabbed)
	{
		grabbed.x += movedX;
		grabbed.y += movedY;
		update_connections(); //evtl. weglassen falls zu langsam
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
	update_connections();
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
	update_connections();
}

function grid()
{
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
	update_connections();
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
	update_connections();
}

function view_fit()
{	
	if(objects.length==0)
	{
		return;
	}
	
	var o_x_min = objects[0];
	var o_y_min = objects[0];
	var o_x_max = objects[0];
	var o_y_max = objects[0];
	
	for(let o of objects)
	{
		if(o.x<o_x_min.x || o.x+o.w<o_x_min.x || (o.x<o_x_min.x+o_x_min.w && o_x_min.w<0))
		{
			o_x_min = o;
		}
		if(o.x+o.w>o_x_max.x+o_x_max.w || o.x-o.w>o_x_max.x+o_x_max.w || (o.x+o.w>o_x_max.x-o_x_max.w && o_x_max.w<0))
		{
			o_x_max = o;
		}
		if(o.y<o_y_min.y || o.y+o.h<o_y_min.y || (o.y<o_y_min.y+o_y_min.h && o_y_min.h<0))
		{
			o_y_min = o;
		}
		if(o.y+o.h>o_y_max.y+o_y_max.h || o.y-o.h>o_y_max.y+o_y_max.h || (o.y+o.h>o_y_max.y-o_y_max.h && o_y_max.h<0))
		{
			o_y_max = o;
		}
	}
	
	while(o_x_min.x<2*grid_distance || o_x_min.x+o_x_min.w<2*grid_distance)
	{
		translate_func(-1,0);
	}
	while(o_y_min.y<grid_distance || o_y_min.y+o_y_min.h<grid_distance)
	{
		translate_func(0,-1);
	}
	while(o_x_min.x>grid_distance && o_x_min.x+o_x_min.w>grid_distance)
	{
		translate_func(1,0);
	}
	while(o_y_min.y>grid_distance && o_y_min.y+o_y_min.h>grid_distance)
	{
		translate_func(0,1);
	}
	
	while(grid_distance<grid_distance_max)
	{
		zoom_func(1);
	}
	while((o_x_max.x>width || o_x_max.x+o_x_max.w>width || o_y_max.y>height || o_y_max.y+o_y_max.h>height) && grid_distance>grid_distance_min)
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
		var read = prompt("Anzahl der Eingänge: [2;"+max_inputs+"]","2");
		inputs = parseInt(read, 10);
		
		if(inputs>max_inputs || inputs<2 || isNaN(inputs))
		{
			if(read!=null)
			{
				alert("Bitte geben Sie nur Zahlen [2;"+max_inputs+"] ein!");
				newGate(type);
			}
			return;
		}
	}
	else
	{
		inv = pow(2,max_inputs+1);
	}
	
	objects.push(new Obj(round((random(width/2))/grid_distance+2)*grid_distance, round((random(height/2))/grid_distance+2)*grid_distance, 2*grid_distance, (inputs+1)*grid_distance, groups.gate,type,inv,2,0,0,0));
	update_connections();
}

function newInOut(group)
{
	var label = 1;
	for(let o of objects)
	{
		if(o.group==group)
		{
			label++;
		}
	}
	
	objects.push(new Obj(round((random(width/2))/grid_distance+2)*grid_distance, round((random(height/2))/grid_distance+2)*grid_distance, 2*grid_distance, 2*grid_distance, group,0,0,1,0,label,0));
	update_connections();
}

function newFixed()
{
	/*
	var read = prompt("Zustand: [0;1]");
	var stat = parseInt(read, 10);

	if(stat>1 || stat<0 || isNaN(stat))
	{
		if(read!=null)
		{
			alert("Bitte geben Sie nur 0 oder 1 ein!");
			newFixed();
		}
		return;
	}
	*/
	
	objects.push(new Obj(round((random(width/2))/grid_distance+2)*grid_distance, round((random(height/2))/grid_distance+2)*grid_distance, grid_distance, grid_distance, groups.fixed,0,0,1,0,0,0));
	update_connections();
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
	alert("Handbuch");
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