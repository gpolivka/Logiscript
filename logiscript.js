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
const no_connection_color = '#FF0000';


const groups = {
	wire: 0,
	gate: 1,
	input: 2,
	output: 3,
	fixed: 4,
	zff: 5
}

const types = {
	not: 0,
	and: 1,
	or:  2,
	xor: 3,
	jk: 4,
	d: 5,
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
var connections_new = [];
var noconnections = [];
var relevant_connections = [];
var relevant_objects = [];
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
var max_iterations = 100;
var max_file_length = 100000;
var disable_event_flag = 0;
var new_drag_flag = 1;
var setup_ready_flag = 0;


class Obj
{
	//wire:		spec_1 = wired		spec_2 = side (drag)
	//gate:		spec_1 = clk_old	spec_2 = ###
	//input:	spec_1 = label		spec_2 = ###
	//output:	spec_1 = label		spec_2 = ###
	//fixed:	spec_1 = ###		spec_2 = ###
	//zff:		spec_1 = clk_old	spec_2 = ###
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
		var found = 0;
		switch(this.group)
		{
			case groups.gate:
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+this.w, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				found = 0;
				for(let c of connections)
				{
					if(c.x==this.x+this.w+grid_distance && c.y==this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2)
					{
						found = 1;
					}
				}
				if(found==0)
				{
					noconnections.push(new NoCon(this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this));
				}
				
				if(binary[0]=='1')
				{
					stroke(0);
					fill('#FFFFFF');
					circle(this.x+this.w+grid_distance*3/8, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, grid_distance/2);
				}
				for(var i=1; i<this.h/grid_distance; i++)
				{
					let stat = 2;
					found = 0;
					for(let c of connections)
					{
						if(c.x==this.x-grid_distance && c.y==this.y+(i*grid_distance))
						{
							stat = c.stat;
							found = 1;
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
							alert("Fehler: Unbekannter Zustand!");
							break;
					}
					strokeWeight(grid_distance/5);
					
					line(this.x-grid_distance, this.y+(i*grid_distance), this.x, this.y+(i*grid_distance));
					if(found==0)
					{
						noconnections.push(new NoCon(this.x-grid_distance, this.y+(i*grid_distance), this));
					}
					
					if(i-1<binary.length && binary[binary.length-i]=='1')
					{
						stroke(0);
						fill('#FFFFFF');
						circle(this.x-grid_distance*3/8, this.y+(i*grid_distance), grid_distance/2);
					}
				}
				
				fill_color(this);
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
					
					case types.d:
						strokeWeight(grid_distance/10);
						textSize(grid_distance*0.75);
						textAlign(RIGHT, CENTER);
						text("D", this.x+this.w/4+grid_distance/4, this.y+grid_distance);
						text("Q", this.x+this.w-grid_distance/4, this.y+grid_distance);
						stroke(gate_stroke_color);
						strokeWeight(grid_distance/5);
						line(this.x, this.y+grid_distance*13/8, this.x+grid_distance*4/8, this.y+2*grid_distance);
						line(this.x+grid_distance*4/8, this.y+2*grid_distance, this.x, this.y+grid_distance*19/8);
						break;
						
					case types.jk:
						strokeWeight(grid_distance/10);
						textSize(grid_distance*0.75);
						textAlign(RIGHT, CENTER);
						text("J", this.x+this.w/4+grid_distance/4, this.y+grid_distance);
						text("K", this.x+this.w/4+grid_distance/4, this.y+3*grid_distance);
						text("Q", this.x+this.w-grid_distance/4, this.y+2*grid_distance);
						stroke(gate_stroke_color);
						strokeWeight(grid_distance/5);
						line(this.x, this.y+grid_distance*13/8, this.x+grid_distance*4/8, this.y+2*grid_distance);
						line(this.x+grid_distance*4/8, this.y+2*grid_distance, this.x, this.y+grid_distance*19/8);
						break;
					
					default:
						alert("Fehler: Unbekannter Gate-Typ!");
						break;
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				fill_color(this);
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+this.w, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				found = 0;
				for(let c of connections)
				{
					if(c.x==this.x+this.w+grid_distance && c.y==this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2)
					{
						found = 1;
					}
				}
				if(found==0)
				{
					noconnections.push(new NoCon(this.x+this.w+grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this));
				}
				
				fill_color(this);
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
				if(this.spec_1==4711)
				{
					stroke(low_color);
					strokeWeight(grid_distance/5);
					line(this.x+this.w/8, this.y+this.h*3/4,this.x+this.w*3/8, this.y+this.h*3/4);
					line(this.x+this.w*3/8, this.y+this.h*3/4,this.x+this.w*3/8, this.y+this.h/4);
					line(this.x+this.w*3/8, this.y+this.h/4,this.x+this.w*5/8, this.y+this.h/4);
					line(this.x+this.w*5/8, this.y+this.h/4,this.x+this.w*5/8, this.y+this.h*3/4);
					line(this.x+this.w*5/8, this.y+this.h*3/4,this.x+this.w*7/8, this.y+this.h*3/4);
				}
				else
				{
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
				}
				break;
				
			case groups.output:
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this.x-grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2);
				found = 0;
				for(let c of connections)
				{
					if(c.x==this.x-grid_distance && c.y==this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2)
					{
						found = 1;
					}
				}
				if(found==0)
				{
					noconnections.push(new NoCon(this.x-grid_distance, this.y+this.h/2-((this.h/grid_distance)%2)*grid_distance/2, this));
				}
				
				if(this==hover || this==grabbed)
				{
					stroke(gate_stroke_color);
					if(this==grabbed)
					{
						fill(grab_color);
					}
					else
					{
						fill(gate_color);
					}
					circle(this.x+grid_distance, this.y+grid_distance, this.w);
					fill(0);
					stroke(gate_color);
					textSize(grid_distance);
					textFont('Arial');
					textStyle(BOLD);
					textAlign(RIGHT, CENTER);
					strokeWeight(0);
					if(this.spec_1>=10)
					{
						text("A", this.x+(this.w/2)+grid_distance/20, this.y+(this.h/2));
						textSize(grid_distance/2);
						textAlign(LEFT, CENTER);
						text(this.spec_1, this.x+(this.w/2)+grid_distance/20, this.y+(this.h/2)+grid_distance/2);
					}
					else
					{
						text("A", this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2));
						textSize(grid_distance/2);
						textAlign(LEFT, CENTER);
						text(this.spec_1, this.x+(this.w/2)+grid_distance/4, this.y+(this.h/2)+grid_distance/2);
					}
				}
				else
				{
					switch(this.stat)
					{
						case 0:
							fill(low_color);
							break;
							
						case 1:
							fill(high_color);
							break;
							
						case 2:
							fill(undefined_color);
							break;
							
						default:
							alert("Fehler: Unbekannter Zustand!");
							break;
					}
					strokeWeight(grid_distance/5);
					stroke(gate_stroke_color);
					circle(this.x+grid_distance, this.y+grid_distance, this.w);
					
					noFill();
					strokeWeight(grid_distance/10);
					stroke(grab_color);
					circle(this.x+grid_distance, this.y+grid_distance, this.w-grid_distance*3/10);
					fill(0);
				}
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+grid_distance/2, this.y, this.x+grid_distance, this.y);
				found = 0;
				for(let c of connections)
				{
					if(c.x==this.x+grid_distance && c.y==this.y)
					{
						found = 1;
					}
				}
				if(found==0)
				{
					noconnections.push(new NoCon(this.x+grid_distance, this.y, this));
				}
				break;
				
			case groups.zff:
				let stat = 2;
				for(let c of connections)
				{
					if(c.x==this.x+this.w/2 && c.y==this.y+this.h+grid_distance)
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
						alert("Fehler: Unbekannter Zustand!");
						break;
				}
				strokeWeight(grid_distance/5);
				line(this.x+this.w/2, this.y+this.h, this.x+this.w/2, this.y+this.h+grid_distance);
				for(var i=1; i<this.h/grid_distance; i++)
				{
					stat = 2;
					for(let c of connections)
					{
						if(c.x==this.x+this.w+grid_distance && c.y==this.y+(i*grid_distance))
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
							alert("Fehler: Unbekannter Zustand!");
							break;
					}
					strokeWeight(grid_distance/5);
					line(this.x+this.w, this.y+(i*grid_distance), this.x+this.w+grid_distance, this.y+(i*grid_distance));
					
					if(this.type==types.jk && i%2==1)
					{
						switch(this.stat[floor(i/2)])
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
								alert("Fehler: Unbekannter Zustand!");
								break;
						}
						strokeWeight(grid_distance/5);
						line(this.x, this.y+(i*grid_distance), this.x-grid_distance, this.y+(i*grid_distance));
					}
					else if(this.type==types.d)
					{
						switch(this.stat[i-1])
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
								alert("Fehler: Unbekannter Zustand!");
								break;
						}
						strokeWeight(grid_distance/5);
						line(this.x, this.y+(i*grid_distance), this.x-grid_distance, this.y+(i*grid_distance));
					}
				}
				
				fill_color(this);
				stroke(gate_stroke_color);
				strokeWeight(grid_distance/5);
				rect(this.x, this.y, this.w, this.h, corner_radius);
				line(this.x+this.w*11/32, this.y+this.h, this.x+this.w/2, this.y+this.h-this.w*5/32);
				line(this.x+this.w*21/32, this.y+this.h, this.x+this.w/2, this.y+this.h-this.w*5/32);
				fill(0);
				
				stroke(gate_color);
				textSize(grid_distance);
				textFont('Arial');
				textStyle(BOLD);
				textAlign(CENTER, CENTER);
				text("Z", this.x+(this.w/2), this.y+(this.h/2));
				
				for(var i=1; i<this.h/grid_distance; i++)
				{
					strokeWeight(grid_distance/10);
					stroke(gate_color);
					textSize(grid_distance*0.75);
					textFont('Arial');
					textStyle(BOLD);
					textAlign(RIGHT, CENTER);
					if(this.type==types.d)
					{
						text("D", this.x+13*(this.w/16)+grid_distance/4, this.y+(i*grid_distance));
						textSize(grid_distance*0.75/2);
						textAlign(LEFT, CENTER);
						text(i, this.x+13*(this.w/16)+grid_distance/4, this.y+(i*grid_distance)+grid_distance*0.75/2);
					}
					else if(this.type==types.jk)
					{
						if(i%2==1)
						{
							text("J", this.x+13*(this.w/16)+grid_distance/4, this.y+(i*grid_distance));
						}
						else
						{
							text("K", this.x+13*(this.w/16)+grid_distance/4, this.y+(i*grid_distance));
						}
						textSize(grid_distance*0.75/2);
						textAlign(LEFT, CENTER);
						text(round(i/2), this.x+13*(this.w/16)+grid_distance/4, this.y+(i*grid_distance)+grid_distance*0.75/2);
					}
					
					if(this.type==types.jk && i%2==1)
					{
						strokeWeight(grid_distance/10);
						stroke(gate_color);
						textSize(grid_distance*0.75);
						textFont('Arial');
						textStyle(BOLD);
						textAlign(RIGHT, CENTER);
						text("Q", this.x+5*(this.w/32)+grid_distance/4, this.y+(i*grid_distance));
						textSize(grid_distance*0.75/2);
						textAlign(LEFT, CENTER);
						text(ceil(i/2), this.x+5*(this.w/32)+grid_distance/4, this.y+(i*grid_distance)+grid_distance*0.75/2);
					}
					else if(this.type==types.d)
					{
						strokeWeight(grid_distance/10);
						stroke(gate_color);
						textSize(grid_distance*0.75);
						textFont('Arial');
						textStyle(BOLD);
						textAlign(RIGHT, CENTER);
						text("Q", this.x+3*(this.w/16)+grid_distance/4, this.y+(i*grid_distance));
						textSize(grid_distance*0.75/2);
						textAlign(LEFT, CENTER);
						text(i, this.x+3*(this.w/16)+grid_distance/4, this.y+(i*grid_distance)+grid_distance*0.75/2);
					}
				}
				break;
			
			default:
				alert("Fehler: Unbekannte Objekt-Gruppe!");
				break;
		}
		draw_connections();
	}
	
	analyse(connection)
	{
		var undef = 0;
		var inputs = [];
		if(this.type!=types.not)
		{
			for(var i=1; i<this.h/grid_distance; i++)
			{
				for(let c of connections)
				{
					if(((c.x==this.x-grid_distance && this.group==groups.gate) || (c.x==this.x+this.w+grid_distance && this.group==groups.zff)) && c.y==this.y+(i*grid_distance))
					{
						if(c.stat!=2)
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
				if(inputs.length<i && (this.type==types.d || this.type==types.jk))
				{
					inputs.push(2);
				}
			}
		}
		if(this.group==groups.gate && this.type!=types.d && this.type!=types.jk)
		{
			var binary = dec2bin(this.inv);
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
		}
		
		switch(this.type)
		{
			case types.not:
				if(connection.stat==2)
				{
					this.stat = 2;
				}
				else if(binary[0] != binary[binary.length-1])
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
				
			case types.jk:
				if(this.group==groups.gate)
				{
					if(inputs[0]==2 || inputs[2]==2)
					{
						this.stat = 2;
					}
					else
					{
						if(inputs[0]==1 && inputs[2]==0)
						{
							this.stat = 1;
						}
						else if(inputs[0]==0 && inputs[2]==1)
						{
							this.stat = 0;
						}
						else if(inputs[0]==1 && inputs[2]==1)
						{
							if(this.stat==0)
							{
								this.stat = 1;
							}
							else if(this.stat==1)
							{
								this.stat = 0;
							}
							else
							{
								this.stat = 2;
							}
						}
					}
				}
				else
				{
					for(let i=0; i<inputs.length-1; i=i+2)
					{
						if(inputs[i]==2 || inputs[i+1]==2)
						{
							this.stat[i/2] = 2;
						}
						else
						{
							if(inputs[i]==1 && inputs[i+1]==0)
							{
								this.stat[i/2] = 1;
							}
							else if(inputs[i]==0 && inputs[i+1]==1)
							{
								this.stat[i/2] = 0;
							}
							else if(inputs[i]==1 && inputs[i+1]==1)
							{
								if(this.stat[i/2]==0)
								{
									this.stat[i/2] = 1;
								}
								else if(this.stat[i/2]==1)
								{
									this.stat[i/2] =0;
								}
								else
								{
									this.stat[i/2] = 2;
								}
							}
						}
					}
				}
				break;
				
			case types.d:
				if(this.group==groups.gate)
				{
					this.stat = inputs[0];
				}
				else
				{
					for(let i=0; i<inputs.length; i++)
					{
						this.stat[i] = inputs[i];
					}
				}
				break;
				
			default:
				alert("Fehler: Unbekannter Gate- oder Z-Typ!");
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

class NoCon
{
	constructor(x,y,obj)
	{
		this.x = x;
		this.y = y;
		this.obj = obj;
	}
	
	draw()
	{
		circle(this.x, this.y, grid_distance/4);
	}
}

function setup()
{
	if(setup_ready_flag==0)
	{
		return;
	}
	
	createCanvas(document.getElementById('div_simulation').clientWidth, document.getElementById('div_simulation').clientHeight);
	grid_size_x = document.getElementById('div_simulation').clientWidth;
	grid_size_y = document.getElementById('div_simulation').clientHeight;
	
	p5.disableFriendlyErrors = true;
	frameRate(24);
	noLoop();
	strokeCap(ROUND);
	
	let text = "";//ScormProcessGetValue("cmi.suspend_data", true);
	if(text[text.length-1]!=';')
	{
		return;
	}
	let objs = text.split(';');
	for(let i=0; i<objs.length-1; i++)
	{
		let properties = objs[i].split(',');
		if(properties.length==11 && parseInt(properties[4])!=groups.zff)
		{
			objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), parseInt(properties[7]), parseInt(properties[8]), parseInt(properties[9]), parseInt(properties[10])));
		}
		else if(parseInt(properties[4])==groups.zff && parseInt(properties[5])==types.jk && properties.length==10+(parseInt(properties[3])/grid_distance-1)/2)
		{
			let outputs = (parseInt(properties[3])/grid_distance-1)/2;
			let stat = [];
			for(let i=0; i<outputs; i++)
			{
				stat.push(2);
			}
			objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), stat, parseInt(properties[7+outputs]), parseInt(properties[8+outputs]), parseInt(properties[9+outputs])));
		}
		else if(parseInt(properties[4])==groups.zff && parseInt(properties[5])==types.d && properties.length==10+(parseInt(properties[3])/grid_distance-1))
		{
			let outputs = (parseInt(properties[3])/grid_distance-1);
			let stat = [];
			for(let i=0; i<outputs; i++)
			{
				stat.push(2);
			}
			objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), stat, parseInt(properties[7+outputs]), parseInt(properties[8+outputs]), parseInt(properties[9+outputs])));
		}
		else
		{
			return;
		}
	}
		
	update_connections(0);
	view_fit();
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
	for(let o of objects)
	{
		o.draw();
	}
}

function fill_color(o)
{
	if(o.group!=groups.wire)
	{
		if(o==grabbed)
		{
			fill(grab_color);
		}
		else if(o==hover)
		{
			fill(hover_color);
		}
		else
		{
			fill(gate_color);
		}
	}
	else if(o.group==groups.wire)
	{
		if(o==grabbed)
		{
			stroke(grab_color);
		}
		else if(o==hover)
		{
			stroke(hover_color);
		}
	}
}

function update_connections(only_connections)
{
	connections_new.length = 0;
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
						if(o.x+o.w+grid_distance==p.x-grid_distance && (p.y<o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2 && p.y+p.h>o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2))
						{
							create_connection(o.x+o.w+grid_distance,o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2,o,p);
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
									create_connection(o.x,o.y,o,p);
								}
								if((p.x==o.x+o.w && p.y==o.y+o.h) || (p.x+p.w==o.x+o.w && p.y+p.h==o.y+o.h))
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
							}
							else if(p.group==groups.gate || p.group==groups.input || p.group==groups.output)
							{
								if(p.x-grid_distance==o.x && (o.y>p.y && o.y<(p.y+p.h)) && p.group!=groups.input)
								{
									create_connection(o.x,o.y,o,p);
								}
								if(p.x-grid_distance==o.x+o.w && (o.y+o.h>p.y && o.y+o.h<(p.y+p.h)) && p.group!=groups.input)
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
								if(p.x+p.w+grid_distance==o.x && o.y==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2 && p.group!=groups.output)
								{
									create_connection(o.x,o.y,o,p);
								}
								if(p.x+p.w+grid_distance==o.x+o.w && o.y+o.h==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2 && p.group!=groups.output)
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
							}
							else if(p.group==groups.fixed)
							{
								if(p.x+grid_distance==o.x && p.y==o.y)
								{
									create_connection(o.x,o.y,o,p);
								}
								if(p.x+grid_distance==o.x+o.w && p.y==o.y+o.h)
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
							}
							else if(p.group==groups.zff)
							{
								if(p.x-grid_distance==o.x && o.y>p.y && o.y<(p.y+p.h))
								{
									if(p.type==types.d || (p.type==types.jk && ((o.y-p.y)/grid_distance)%2==1))
									{
										create_connection(o.x,o.y,o,p);
									}
								}
								if(p.x-grid_distance==o.x+o.w && o.y+o.h>p.y && o.y+o.h<(p.y+p.h))
								{
									if(p.type==types.d || (p.type==types.jk && ((o.y+o.h-p.y)/grid_distance)%2==1))
									{
										create_connection(o.x+o.w,o.y+o.h,o,p);
									}
								}
								if(p.x+p.w+grid_distance==o.x && o.y>p.y && o.y<(p.y+p.h))
								{
									create_connection(o.x,o.y,o,p);
								}
								if(p.x+p.w+grid_distance==o.x+o.w && o.y+o.h>p.y && o.y+o.h<(p.y+p.h))
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
								if(p.x+p.w/2==o.x && p.y+p.h+grid_distance==o.y)
								{
									create_connection(o.x,o.y,o,p);
								}
								if(p.x+p.w/2==o.x+o.w && p.y+p.h+grid_distance==o.y+o.h)
								{
									create_connection(o.x+o.w,o.y+o.h,o,p);
								}
							}
						}
					}
				}
				break;
				
			case groups.input:
				for(let p of objects)
				{
					if(p.group==groups.gate)
					{
						if(o.x+o.w+grid_distance==p.x-grid_distance && (p.y<o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2 && p.y+p.h>o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2))
						{
							create_connection(o.x+o.w+grid_distance,o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2,o,p);
						}
					}
				}
				break;
				
			case groups.output:
				for(let p of objects)
				{
					if(p.group==groups.gate || p.group==groups.input)
					{
						if(o.x-grid_distance==p.x+p.w+grid_distance && o.y+grid_distance==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2)
						{
							create_connection(o.x-grid_distance,o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2,o,p);
						}
					}
				}
				break;
				
			case groups.fixed:
				for(let p of objects)
				{
					if(p.group==groups.gate || p.group==groups.output)
					{
						if(o.x+grid_distance==p.x-grid_distance && (o.y>p.y && o.y<(p.y+p.h)))
						{
							create_connection(o.x+grid_distance,o.y,o,p);
						}
					}
				}
				break;
				
			case groups.zff:
				for(let p of objects)
				{
					if(p.group==groups.gate || p.group==groups.input)
					{
						if(o.x-grid_distance==p.x+p.w+grid_distance && o.y<p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2 && o.y+o.h>p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2)
						{
							if(o.type==types.d || (o.type==types.jk && ((p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2-o.y)/grid_distance)%2==1))
							{
								create_connection(o.x-grid_distance,p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2,o,p);
							}
						}
						if(o.x+o.w/2==p.x+p.w+grid_distance && o.y+o.h+grid_distance==p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2)
						{
							create_connection(o.x+o.w/2,p.y+p.h/2-((p.h/grid_distance)%2)*grid_distance/2,o,p);
						}
						if(p.group==groups.gate && o.x+o.w/2==p.x-grid_distance && o.y+o.h+grid_distance>p.y && o.y+o.h+grid_distance<p.y+p.h)
						{
							create_connection(o.x+o.w/2,o.y+o.h+grid_distance,o,p);
						}
					}
					else if(p.group==groups.fixed)
					{
						if(o.x-grid_distance==p.x+grid_distance && o.y<p.y && o.y+o.h>p.y)
						{
							if(o.type==types.d || (o.type==types.jk && ((p.y-o.y)/grid_distance)%2==1))
							{
								create_connection(o.x-grid_distance,p.y,o,p);
							}
						}
						if(p.x+grid_distance==o.x+o.w/2 && p.y==o.y+o.h+grid_distance)
						{
							create_connection(p.x+grid_distance,p.y,o,p);
						}
					}
					else if(p.group==groups.output)
					{
						if(o.x+o.w+grid_distance==p.x-grid_distance && o.y<=p.y && o.y+o.h>p.y+grid_distance)
						{
							create_connection(o.x+o.w+grid_distance,p.y+grid_distance,o,p);
						}
						if(p.x-grid_distance==o.x+o.w/2 && p.y==o.y+o.h)
						{
							create_connection(p.x-grid_distance,p.y+grid_distance,o,p);
						}
					}
				}
				break;
				
			default:
				alert("Fehler: Unbekannte Objekt-Gruppe!");
				break;
		}
	}
	
	var found = 0;
	for(let c of connections_new)
	{
		for(let d of connections)
		{
			if(c.x==d.x && c.y==d.y)
			{
				c.stat = d.stat;
				found = 1;
			}
		}
		if(found==0)
		{
			c.stat = 2;
		}
	}
	
	connections.length = 0;
	connections.push.apply(connections, connections_new);
	
	noconnections.length = 0;
	let side;
	for(let w of objects)
	{
		if(w.group==groups.wire && w.spec_1==0)
		{
			found = 0;
			side = 0;
			for(let c of connections)
			{
				if(w.x==c.x && w.y==c.y)
				{
					found++;
					side = 0;
				}
				else if(w.x+w.w==c.x && w.y+w.h==c.y)
				{
					found++;
					side = 1;
				}
			}
			if(found==0)
			{
				noconnections.push(new NoCon(w.x, w.y, w));
				noconnections.push(new NoCon(w.x+w.w, w.y+w.h, w));
			}
			else if(found==1)
			{
				if(side==1)
				{
					noconnections.push(new NoCon(w.x, w.y, w));
				}
				else
				{
					noconnections.push(new NoCon(w.x+w.w, w.y+w.h, w));
				}
			}
		}
	}
	
	if(only_connections==0)
	{
		analyse();
	}
	draw();
}

function create_connection(x,y,o,p)
{
	var found = 0;
	for(let c of connections_new)
	{
		if(c.x==x && c.y==y)
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
		new_Con = new Con(x, y);
		new_Con.obj_list.push(o);
		new_Con.obj_list.push(p);
		connections_new.push(new_Con);
	}
}

function draw_connections()
{
	strokeWeight(grid_distance/5);
	for(let c of connections)
	{
		if(c.obj_list.length==2)
		{
			continue;
		}
		
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
				alert("Fehler: Unbekannter Zustand!");
				break;
		}
		circle(c.x, c.y, grid_distance/4);
	}
	
	stroke(no_connection_color);
	fill(no_connection_color);
	for(let c of noconnections)
	{
		circle(c.x, c.y, grid_distance/1000);
	}
}

function analyse()
{
	var cycle_0 = [];
	var cycle_1 = [];
	for(let c of connections)
	{
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
	
	let steady_state = 0;
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
							alert("Kurzschluss oder Leiterschleife!");
							document.getElementById("alarm").style.visibility = "visible";
						}
						return;
					}
					if((o.type!=types.d && o.type!=types.jk) || (c.y==o.y+2*grid_distance && c.stat==1 && o.spec_1==0))
					{
						o.analyse(c);
					}
					for(let d of connections)
					{
						if(d.stat!=o.stat || steady_state==0)
						{
							if(d.x==o.x+o.w+grid_distance && d.y==o.y+o.h/2-((o.h/grid_distance)%2)*grid_distance/2)
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
					if(c.y==o.y+2*grid_distance)
					{
						o.spec_1 = c.stat;
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
				else if(o.group==groups.zff && o!=c.start_obj)
				{
					if(c.x<o.x)
					{
						if(shortcircuitflag==0)
						{
							shortcircuitflag = 1;
							alert("Kurzschluss oder Leiterschleife!");
							document.getElementById("alarm").style.visibility = "visible";
						}
						return;
					}
					if(c.x==o.x+o.w/2)
					{
						if(c.stat==1 && o.spec_1==0)
						{
							o.analyse(c);
						}
						for(let d of connections)
						{
							for(var i=1; i<o.h/grid_distance; i++)
							{
								if(o.type==types.d || (o.type==types.jk && i%2==1))
								{
									if(d.stat!=o.stat[floor(i/2)] || steady_state==0)
									{
										if(d.x==o.x-grid_distance && d.y==o.y+(i*grid_distance))
										{
											d.stat = o.stat[floor(i/2)];
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
								else if(o.type==types.d)
								{
									if(d.stat!=o.stat[i-1] || steady_state==0)
									{
										if(d.x==o.x-grid_distance && d.y==o.y+(i*grid_distance))
										{
											d.stat = o.stat[i-1];
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
						}
						o.spec_1 = c.stat;
					}
				}
			}
		}
		
		steady_state = 0;
		for(let c of cycle_1)
		{
			if(c.done>1)
			{
				steady_state++;
			}
		}
		if(steady_state>=cycle_1.length)
		{
			steady_state = 1;
		}
		else
		{
			steady_state = 0;
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
			for(let o of c.obj_list)
			{
				if(o.group!=groups.zff)
				{
					o.stat = 2;
				}
			}
		}
	}
	
	var found = 0;
	for(let o of objects)
	{
		if(o.group!=groups.input && o.group!=groups.fixed)
		{
			for(let c of connections)
			{
				for(let d of c.obj_list)
				{
					if(d==o)
					{
						found = 1;
					}
				}
			}
			if(found==0 && o.group!=groups.zff)
			{
				o.stat = 2;
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

function mouseMoved()
{
	m = createVector(mouseX, mouseY);
	hover = null;
	for(let o of objects)
	{
		if(o.erase==1)
		{
			continue;
		}
		
		if(o.group==groups.gate || o.group==groups.input || o.group==groups.output || o.group==groups.zff)
		{
			if(m.x>o.x-grid_distance*3/8-grab_tolerance*(grid_distance/5) && m.x<o.x+o.w+grid_distance*3/8+grab_tolerance*(grid_distance/5) && m.y>o.y-grab_tolerance*(grid_distance/5) && m.y<o.y+o.h+grab_tolerance*(grid_distance/5))
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
	draw();
}

function mousePressed()
{
	if(disable_event_flag==1)
	{
		return;
	}

	new_drag_flag = 1;
	var not_flag = 0;
	if(hover)
	{
		if(mouseButton == LEFT)
		{
			if(hover.group==groups.gate && hover.type!=types.d && hover.type!=types.jk)
			{
				for(var i=1; i<hover.h/grid_distance; i++)
				{
					var v = createVector(hover.x-grid_distance*3/8, hover.y+(i*grid_distance));
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
				
				v = createVector(hover.x+hover.w+grid_distance*3/8, hover.y+hover.h/2-((hover.h/grid_distance)%2)*grid_distance/2);
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
			
			if(hover.group==groups.input && hover.spec_1==4711)
			{
				hover.stat = 1;
			}
		}
		else if(hover.erase==0)
		{
			deleteObj(hover);
		}
	}
	
	if(selected==1 && mouseButton==LEFT && grabbed==null && not_flag==0)
	{
		if(m.x>0 && m.y>0 && m.x<width && m.y<height)
		{
			if(hover!=null && hover.group==groups.wire)
			{
				let w_1 = round((m.x-hover.x)/grid_distance)*grid_distance;
				let h_1 = round((m.y-hover.y)/grid_distance)*grid_distance;
				let w_2 = hover.x+hover.w-round(m.x/grid_distance)*grid_distance;
				let h_2 = hover.y+hover.h-round(m.y/grid_distance)*grid_distance;
				
				if(w_1!=0 || h_1!=0)
				{
					wire_1 = new Obj(hover.x, hover.y, round((m.x-hover.x)/grid_distance)*grid_distance, round((m.y-hover.y)/grid_distance)*grid_distance, groups.wire,0,0,2,0,0,0);
					objects.push(wire_1);
				}
				if(w_2!=0 || h_2!=0)
				{
					wire_2 = new Obj(round(m.x/grid_distance)*grid_distance, round(m.y/grid_distance)*grid_distance, hover.x+hover.w-round(m.x/grid_distance)*grid_distance, hover.y+hover.h-round(m.y/grid_distance)*grid_distance, groups.wire,0,0,2,0,0,0);
					objects.push(wire_2);
				}
				objects.splice(objects.indexOf(hover), 1);
			}
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
	update_connections(0);
}

function mouseDragged()
{
	if(disable_event_flag==1)
	{
		return;
	}
	
	if (grabbed)
	{
		grabbed.x += movedX;
		grabbed.y += movedY;
		
		if(new_drag_flag==1)
		{
			relevant_connections.length = 0;
			relevant_objects.length = 0;
			if(grabbed.group!=groups.wire)
			{
				for(let c of connections)
				{
					for(let o of c.obj_list)
					{
						if(o==grabbed)
						{
							relevant_connections.push(c);
							for(let p of c.obj_list)
							{
								if(p!=grabbed)
								{
									if(p.group==groups.wire)
									{
										relevant_objects.push(p);
										if(p.x==c.x && p.y==c.y)
										{
											p.spec_2 = 0;
											p.x += movedX;
											p.y += movedY;
											p.w -= movedX;
											p.h -= movedY;
										}
										else
										{
											p.spec_2 = 1;
											p.w += movedX;
											p.h += movedY;
										}
									}
									else if(p.group==groups.input || p.group==groups.output || p.group==groups.fixed)
									{
										relevant_objects.push(p);
										p.x += movedX;
										p.y += movedY;
									}
									else
									{
										let new_wire = new Obj(c.x, c.y, movedX, movedY, groups.wire,0,0,2,0,0,1);
										objects.push(new_wire);
										relevant_objects.push(new_wire);
									}
								}
							}
							c.x += movedX;
							c.y += movedY;
							break;
						}
					}
				}
			}
			new_drag_flag = 0;
		}
		else
		{
			for(let o of relevant_objects)
			{
				if(o.group==groups.wire)
				{
					if(o.spec_2==0)
					{
						o.x += movedX;
						o.y += movedY;
						o.w -= movedX;
						o.h -= movedY;
					}
					else
					{
						o.w += movedX;
						o.h += movedY;
					}
				}
				else
				{
					o.x += movedX;
					o.y += movedY;
				}
			}
			for(let c of relevant_connections)
			{
				c.x += movedX;
				c.y += movedY;
			}
		}
		update_connections(0);
	}
}

function mouseReleased()
{
	if(disable_event_flag==1)
	{
		return;
	}
	
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
		for(let o of objects)
		{
			o.x = round(o.x/grid_distance)*grid_distance;
			o.y = round(o.y/grid_distance)*grid_distance;
			o.w = round(o.w/grid_distance)*grid_distance;
			o.h = round(o.h/grid_distance)*grid_distance;
			if(o.w==0 && o.h==0 && o.spec_1==0)
			{
				objects.splice(objects.indexOf(o), 1);
			}
		}
		grabbed.draw();
		grabbed = null;
	}
	update_connections(0);
}

function keyPressed()
{
	if(disable_event_flag==1)
	{
		if(getComputedStyle(input_form).getPropertyValue('visibility')=="visible" && keyCode==ESCAPE)
		{
			document.getElementById("input_form").reset();
			document.getElementById("input_form").style.visibility = "hidden";
			document.getElementById("div_simulation").style.visibility = "visible";
			disable_event_flag = 0;
		}
		return;
	}
	
	if(hover)
	{
		if(keyCode==DELETE && hover.erase==0)
		{
			deleteObj(hover);
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
	update_connections(0);
}

function keyTyped()
{
	if(disable_event_flag==1)
	{
		return;
	}
	
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
	update_connections(0);
}

function deleteObj(o)
{
	objects.splice(objects.indexOf(o), 1);
	if(o.group==groups.wire)
	{
		let wires_to_remove = [];
		for(let c of connections)
		{
			if(((c.x==o.x && c.y==o.y) || (c.x==o.x+o.w && c.y==o.y+o.h)) && c.obj_list.length==2 && c.obj_list[0].group==groups.wire && c.obj_list[1].group==groups.wire)
			{
				if(c.obj_list[0]==o)
				{
					wires_to_remove.push(c.obj_list[1]);
				}
				else
				{
					wires_to_remove.push(c.obj_list[0]);
				}
			}
		}
		update_connections(1);
		for(let w of wires_to_remove)
		{
			deleteObj(w);
		}
	}
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
	update_connections(0);
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
	for(let c of connections)
	{
		c.x -= x*grid_distance;
		c.y -= y*grid_distance;
	}
	update_connections(0);
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
	
	var x_min = o_x_min.x;
	var y_min = o_y_min.y;
	var x_max = o_x_max.x+o_x_max.w;
	var y_max = o_y_max.y+o_y_max.h;
	
	for(let o of objects)
	{
		if(o.group!=groups.wire)
		{
			if(o.x<x_min)
			{
				o_x_min = o;
				x_min = o.x;
			}
			if(o.x+o.w>o_x_max.x+o_x_max.w)
			{
				o_x_max = o;
				x_max = o.x+o.w;
			}
			if(o.y<o_y_min.y)
			{
				o_y_min = o;
				y_min = o.y;
			}
			if(o.y+o.h>o_y_max.y+o_y_max.h)
			{
				o_y_max = o;
				y_max = o.y+o.h;
			}
		}
		else
		{
			if(o.w<0)
			{
				if(o.x+o.w<x_min)
				{
					o_x_min = o;
					x_min = o.x+o.w;
				}
				if(o.x>o_x_max.x+o_x_max.w)
				{
					o_x_max = o;
					x_max = o.x;
				}
			}
			else
			{
				if(o.x<x_min)
				{
					o_x_min = o;
					x_min = o.x;
				}
				if(o.x+o.w>o_x_max.x+o_x_max.w)
				{
					o_x_max = o;
					x_max = o.x+o.w;
				}
			}
			
			if(o.h<0)
			{
				if(o.y+o.h<o_y_min.y)
				{
					o_y_min = o;
					y_min = o.y+o.h;
				}
				if(o.y>o_y_max.y+o_y_max.h)
				{
					o_y_max = o;
					y_max = o.y;
				}
			}
			else
			{
				if(o.y<o_y_min.y)
				{
					o_y_min = o;
					y_min = o.y;
				}
				if(o.y+o.h>o_y_max.y+o_y_max.h)
				{
					o_y_max = o;
					y_max = o.y+o.h;
				}
			}
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
	while((o_x_max.x>width || o_x_max.x+o_x_max.w>width || o_y_max.y>height || o_y_max.y+o_y_max.h>height || (o_y_max.y+o_y_max.h+grid_distance>height && o_y_max.group==groups.zff)) && grid_distance>grid_distance_min)
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
	
	let found = 1;
	while(found==1)
	{
		found = 0;
		new_Gate = new Obj(round(random(width-2*grid_distance)/grid_distance)*grid_distance, round(random(height-2*grid_distance)/grid_distance)*grid_distance, 2*grid_distance, (inputs+1)*grid_distance, groups.gate,type,inv,2,0,0,0);
		objects.push(new_Gate);
		update_connections(1);
		
		for(let c of connections)
		{
			if(c.x>=new_Gate.x-grid_distance && c.x<=new_Gate.x+3*grid_distance && c.y>=new_Gate.y && c.y<=new_Gate.y+(inputs+1)*grid_distance)
			{
				found = 1;
				break;
			}
		}
		
		if(found==1)
		{
			objects.pop();
			update_connections(1);
		}
	}
}

function newInOut(group)
{
	var label = 1;
	for(let o of objects)
	{
		if(o.group==group && o.spec_1!=4711)
		{
			label++;
		}
	}

	let stat = 2;
	if(group==groups.input)
	{
		stat = 1;
	}
	
	let found = 1;
	while(found==1)
	{
		found = 0;
		new_InOut = new Obj(round(random(width-2*grid_distance)/grid_distance)*grid_distance, round(random(height-2*grid_distance)/grid_distance)*grid_distance, 2*grid_distance, 2*grid_distance, group,0,0,stat,0,label,0);
		objects.push(new_InOut);
		update_connections(1);
		
		let relevant_point = createVector(new_InOut.x+new_InOut.w+grid_distance, new_InOut.y+grid_distance);
		if(group==groups.output)
		{
			relevant_point.x = new_InOut.x-grid_distance;
		}
		
		for(let c of connections)
		{
			if(c.x==relevant_point.x && c.y==relevant_point.y)
			{
				found = 1;
				break;
			}
		}
		
		if(found==1)
		{
			objects.pop();
			update_connections(1);
		}
	}
}

function newFixed()
{
	let found = 1;
	while(found==1)
	{
		found = 0;
		new_Fixed = new Obj(round(random(width-2*grid_distance)/grid_distance+1)*grid_distance, round(random(height-2*grid_distance)/grid_distance+1)*grid_distance, grid_distance, grid_distance, groups.fixed,0,0,1,0,0,0);
		objects.push(new_Fixed);
		update_connections(1);
		
		for(let c of connections)
		{
			if(c.x==new_Fixed.x+grid_distance && c.y==new_Fixed.y)
			{
				found = 1;
				break;
			}
		}
		
		if(found==1)
		{
			objects.pop();
			update_connections(1);
		}
	}
}

function sel(item)
{
	selected = item;
	switch(item)
	{
		case 0:
			document.getElementById("button_cursor").style.borderStyle = "inset";
			document.getElementById("button_wire").style.borderStyle = "outset";
			break;
			
		case 1:
			document.getElementById("button_cursor").style.borderStyle = "outset";
			document.getElementById("button_wire").style.borderStyle = "inset";
			break;
			
		default:
			alert(unescape("Fehler%3A Ung%FCltiges Argument"));
			break;
	}
}

function load_circuit(arg)
{
	if(arg==0)
	{
		document.getElementById("input_form").style.visibility = "visible";
		document.getElementById("div_simulation").style.visibility = "hidden";
		disable_event_flag = 1;
	}
	else if(arg==1)
	{
		objects.length = 0;
		zoom_func(-zoom);
		translate_func(-trans_x, -trans_y);
		
		let text = document.forms["input_form"].elements["text"].value;
		if(text[text.length-1]!=';')
		{
			alert("Schaltung ungültig!");
			return;
		}
		let objs = text.split(';');
		for(let i=0; i<objs.length-1; i++)
		{
			let properties = objs[i].split(',');
			if(properties.length==11 && parseInt(properties[4])!=groups.zff)
			{
				objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), parseInt(properties[7]), parseInt(properties[8]), parseInt(properties[9]), parseInt(properties[10])));
			}
			else if(parseInt(properties[4])==groups.zff && parseInt(properties[5])==types.jk && properties.length==10+(parseInt(properties[3])/grid_distance-1)/2)
			{
				let outputs = (parseInt(properties[3])/grid_distance-1)/2;
				let stat = [];
				for(let i=0; i<outputs; i++)
				{
					stat.push(2);
				}
				objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), stat, parseInt(properties[7+outputs]), parseInt(properties[8+outputs]), parseInt(properties[9+outputs])));
			}
			else if(parseInt(properties[4])==groups.zff && parseInt(properties[5])==types.d && properties.length==10+(parseInt(properties[3])/grid_distance-1))
			{
				let outputs = (parseInt(properties[3])/grid_distance-1);
				let stat = [];
				for(let i=0; i<outputs; i++)
				{
					stat.push(2);
				}
				objects.push(new Obj(parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseInt(properties[3]), parseInt(properties[4]), parseInt(properties[5]), parseInt(properties[6]), stat, parseInt(properties[7+outputs]), parseInt(properties[8+outputs]), parseInt(properties[9+outputs])));
			}
			else
			{
				alert("Schaltung ungültig!");
				return;
			}
			
		}
		document.getElementById("input_form").reset();
		document.getElementById("input_form").style.visibility = "hidden";
		document.getElementById("div_simulation").style.visibility = "visible";
		disable_event_flag = 0;
		update_connections(0);
		view_fit();
	}
}

document.forms["input_form"].elements["input_file"].onchange = function(event)
{
	var reader = new FileReader();
	reader.onload = function(event)
	{
		if(event.target.readyState != 2)
		{
			return;
		}
		if(event.target.error)
		{
			alert("Fehler beim Einlesen!");
			return;
		}
		filecontent = event.target.result;
		if(event.target.result.length>max_file_length)
		{
			alert("Datei ist zu groß!");
			return;
		}
		document.forms["input_form"].elements["text"].value = event.target.result;
	};
	reader.readAsText(event.target.files[0]);
};

function save_circuit()
{
	zoom_func(-zoom);
	
	let text = "";
	for(let o of objects)
	{
		text = text.concat(o.x,",",o.y,",",o.w,",",o.h,",",o.group,",",o.type,",",o.inv,",",o.stat,",",o.erase,",",o.spec_1,",",o.spec_2,";");
	}
	var myBlob = new Blob([text], {type: "text/plain"});
	var url = window.URL.createObjectURL(myBlob);
	var anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "Circuit.txt";
	anchor.click();
	window.URL.revokeObjectURL(url);
	anchor.remove();
	
	view_fit();
}

function clear_circuit()
{
	if (confirm("Wollen Sie die Schaltung wirklich löschen?"))
	{
		var erase_objs = [];
		for(let o of objects)
		{
			if(o.erase==1)
			{
				erase_objs.push(o);
			}
		}
		objects.length = 0;
		for(let o of erase_objs)
		{
			objects.push(o);
		}
		
		update_connections(0);
		view_fit();
	}
}

function task()
{
	document.getElementById("button_main_page").style.marginTop = "2px";
	document.getElementById("div_welcome").style.display = "none";
	document.getElementById("iframe_manual").style.visibility = "collapse";
	document.getElementById("iframe_task").style.visibility = "visible";
	document.getElementById("div_simulation").style.visibility = "collapse";
	document.getElementById("button_close").style.display = "inline";
	document.getElementById("button_open_new_window").style.display = "inline";
	document.getElementById("button_check").style.display = "none";
	document.getElementById("alarm").style.display = "none";
	
	document.getElementById("button_task").style.borderStyle = "inset";
	document.getElementById("button_manual").style.borderStyle = "outset";
	document.getElementById("button_simulation").style.borderStyle = "outset";
	
	//document.getElementById("div_button_top").style.visibility = "collapse";
	//document.getElementById("div_button_side_left").style.display = "none";
	//document.getElementById("div_button_side_right").style.display = "inline";
}

function manual()
{
	document.getElementById("button_main_page").style.marginTop = "2px";
	document.getElementById("div_welcome").style.display = "none";
	document.getElementById("iframe_manual").style.visibility = "visible";
	document.getElementById("iframe_task").style.visibility = "collapse";
	document.getElementById("div_simulation").style.visibility = "collapse";
	document.getElementById("button_close").style.display = "inline";
	document.getElementById("button_open_new_window").style.display = "inline";
	document.getElementById("button_check").style.display = "none";
	document.getElementById("alarm").style.display = "none";
	
	document.getElementById("button_task").style.borderStyle = "outset";
	document.getElementById("button_manual").style.borderStyle = "inset";
	document.getElementById("button_simulation").style.borderStyle = "outset";
	
	//document.getElementById("div_button_top").style.visibility = "collapse";
	//document.getElementById("div_button_side_left").style.display = "none";
	//document.getElementById("div_button_side_right").style.display = "inline";
}

function check()
{
	alert("Schaltung überprüfen");
}

function simulation()
{
	document.getElementById("button_main_page").style.marginTop = "2px";
	document.getElementById("div_welcome").style.display = "none";
	document.getElementById("iframe_manual").style.visibility = "collapse";
	document.getElementById("iframe_task").style.visibility = "collapse";
	document.getElementById("div_simulation").style.visibility = "visible";
	document.getElementById("button_close").style.display = "none";
	document.getElementById("button_open_new_window").style.display = "none";
	document.getElementById("button_check").style.display = "inline";
	document.getElementById("alarm").style.display = "inline";
	
	document.getElementById("button_task").style.borderStyle = "outset";
	document.getElementById("button_manual").style.borderStyle = "outset";
	document.getElementById("button_simulation").style.borderStyle = "inset";
	
	//document.getElementById("div_button_top").style.visibility = "visible";
	//document.getElementById("div_button_side_left").style.display = "inline";
	//document.getElementById("div_button_side_right").style.display = "inline";
	
	if(setup_ready_flag==0)
	{
		setup_ready_flag = 1;
		setup();
	}
}

function open_new_window()
{
	if(document.getElementById("iframe_manual").style.visibility=="visible")
	{
		window.open ("./other/manual.pdf","","popup");
	}
	else
	{
		window.open ("./other/task.pdf","","popup");
	}
	simulation();
}

function main_page()
{
	document.getElementById("button_main_page").style.marginTop = "132px";
	document.getElementById("div_welcome").style.display = "inline";
	document.getElementById("iframe_manual").style.visibility = "collapse";
	document.getElementById("iframe_task").style.visibility = "collapse";
	document.getElementById("div_simulation").style.visibility = "collapse";
	document.getElementById("button_close").style.display = "none";
	document.getElementById("button_open_new_window").style.display = "none";
	document.getElementById("button_check").style.display = "none";
	document.getElementById("alarm").style.display = "none";
	
	//document.getElementById("div_button_top").style.visibility = "collapse";
	//document.getElementById("div_button_side_left").style.display = "none";
	//document.getElementById("div_button_side_right").style.display = "none";
}

function set_input(label, stat)
{
	let found = 0;
	for(let o of objects)
	{
		if(o.group==groups.input && o.spec_1==label)
		{
			o.stat = stat;
			update_connections(0);
			return 0;
		}
	}
	if(found==0)
	{
		return 1;
	}
}

function read_output(label)
{
	let found = 0;
	for(let o of objects)
	{
		if(o.group==groups.output && o.spec_1==label)
		{
			return o.stat;
			return 0;
		}
	}
	if(found==0)
	{
		return 1;
	}
}

function setup_task()
{
	let name = ScormProcessGetValue("cmi.learner_name", true).split(',');
	document.getElementById("span_welcome").innerHTML = "Guten Tag, <b>"+name[1]+" "+name[0]+"</b>";
	//alert("ID: "+ScormProcessGetValue("cmi.learner_id", true));
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


//SCORM --------------------------------------------------------
var startTimeStamp = null;
var processedUnload = false;

function doStart()
{
	/*
	startTimeStamp = new Date();
	ScormProcessInitialize();
	var completionStatus = ScormProcessGetValue("cmi.completion_status", true);
	if (completionStatus == "unknown"){
		ScormProcessSetValue("cmi.completion_status", "incomplete");
	}
	*/
	alert("Um den Angabe-Auswahl-Algorithmus geheim zu halten\nlade ich zukünftige Versionen nicht mehr auf GitHub hoch.");
	setup_task();
}

function doUnload(pressedExit)
{
	/*
	zoom_func(-zoom);
	let text = "";
	for(let o of objects)
	{
		text = text.concat(o.x,",",o.y,",",o.w,",",o.h,",",o.group,",",o.type,",",o.inv,",",o.stat,",",o.erase,",",o.spec_1,",",o.spec_2,";");
	}
	//TESTTESTTEST##########################################
	if(text == "25,350,100,125,5,4,0,2,2,0,0,0;25,25,100,125,5,5,0,2,2,2,2,0,0,0;")
	{
		RecordTest();
	}
	//TESTTESTTEST##########################################
	ScormProcessSetValue("cmi.suspend_data", "");
	ScormProcessSetValue("cmi.suspend_data", text);
	ScormProcessSetValue("cmi.exit", "suspend");
	
	if(processedUnload==true)
	{
		return;
	}
	processedUnload = true;
	
	var endTimeStamp = new Date();
	var totalMilliseconds = (endTimeStamp.getTime()-startTimeStamp.getTime());
	var scormTime = ConvertMilliSecondsIntoSCORM2004Time(totalMilliseconds);
	ScormProcessSetValue("cmi.session_time", scormTime);
	
	ScormProcessTerminate();
	*/
}

function ConvertMilliSecondsIntoSCORM2004Time(intTotalMilliseconds)
{
	/*
	var ScormTime = "";
	var HundredthsOfASecond;
	
	var Seconds;
	var Minutes;
	var Hours;
	var Days;
	var Months;
	var Years;
	
	var HUNDREDTHS_PER_SECOND = 100;
	var HUNDREDTHS_PER_MINUTE = HUNDREDTHS_PER_SECOND*60;
	var HUNDREDTHS_PER_HOUR   = HUNDREDTHS_PER_MINUTE*60;
	var HUNDREDTHS_PER_DAY    = HUNDREDTHS_PER_HOUR*24;
	var HUNDREDTHS_PER_MONTH  = HUNDREDTHS_PER_DAY*(((365*4)+1)/48);
	var HUNDREDTHS_PER_YEAR   = HUNDREDTHS_PER_MONTH * 12;
	
	HundredthsOfASecond = Math.floor(intTotalMilliseconds/10);
	Years = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_YEAR);
	HundredthsOfASecond -= (Years*HUNDREDTHS_PER_YEAR);
	Months = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_MONTH);
	HundredthsOfASecond -= (Months*HUNDREDTHS_PER_MONTH);
	Days = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_DAY);
	HundredthsOfASecond -= (Days*HUNDREDTHS_PER_DAY);
	Hours = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_HOUR);
	HundredthsOfASecond -= (Hours*HUNDREDTHS_PER_HOUR);
	Minutes = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_MINUTE);
	HundredthsOfASecond -= (Minutes*HUNDREDTHS_PER_MINUTE);
	Seconds = Math.floor(HundredthsOfASecond/HUNDREDTHS_PER_SECOND);
	HundredthsOfASecond -= (Seconds*HUNDREDTHS_PER_SECOND);
	
	if(Years>0)
	{
		ScormTime += Years+"Y";
	}
	if(Months>0)
	{
		ScormTime += Months+"M";
	}
	if(Days>0)
	{
		ScormTime += Days+"D";
	}
	
	if((HundredthsOfASecond+Seconds+Minutes+Hours)>0)
	{
		ScormTime += "T";
		if(Hours>0)
		{
			ScormTime += Hours+"H";
		}
		if(Minutes>0)
		{
			ScormTime += Minutes+"M";
		}
		if((HundredthsOfASecond+Seconds)>0)
		{
			ScormTime += Seconds;
			if(HundredthsOfASecond>0)
			{
				ScormTime += "."+HundredthsOfASecond;
			}
			ScormTime += "S";
		}
	}
	
	if(ScormTime=="")
	{
		ScormTime = "0S";
	}
	
	ScormTime = "P"+ScormTime;
	return ScormTime;
	*/
}

function RecordTest()
{
	/*
	let score = 100;
	ScormProcessSetValue("cmi.score.raw", score);
	ScormProcessSetValue("cmi.score.min", "0");
	ScormProcessSetValue("cmi.score.max", "100");
	ScormProcessSetValue("cmi.score.scaled", score/100);
	
	ScormProcessSetValue("cmi.success_status", "passed");
	ScormProcessSetValue("cmi.completion_status", "completed");
	*/
}
//SCORM-Ende ---------------------------------------------------