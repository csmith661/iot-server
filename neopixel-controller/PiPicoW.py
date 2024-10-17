import time
import network
import urequests
import machine
from machine import Pin
import neopixel
import _thread

##----config----##
FPS = 30
seconds_per_poll = 7
LED_COUNT = 200
LED_PIN = 16
position = 2


##---- setup ----##
current_frame = 0
status = 'off'
prev_status = 'off'


#-- color setup --#

#LEDS for the NP is RBG
selected_color = (0, 0, 0)
trouble_color = (255, 0, 0)
recovery_color = (0, 0, 175)

color = (0, 0, 0)

#--state_counters --#
trouble_animation_cycle_count = 0
recovery_animation_cycle_count = 0


#animations can be none, slow_pulse, tron, wig wag, strobe
selected_animation = 'none'
animation = 'none'
last_frame_animation = 'none'

#---strip setup---#

strip = neopixel.NeoPixel(Pin(LED_PIN), LED_COUNT)


current_strip_state = []

def init_current_strip_state():
    global current_strip_state
    for i in range(len(strip)):
        current_strip_state.append(color)
  
    return current_strip_state




def generate_blank_strip():
    global strip
    new_strip = []
    for i in range(len(strip)):
        new_strip.append((0,0,0))
    return new_strip

#---global clock --#
time_per_loop = 1/FPS
last_update = time.time_ns()


def check_if_frame_update():
    global last_update
    global current_frame
    global time_per_loop


    now = time.time_ns()
    
    elapsed = (now - last_update) / 1_000_000_000
    
    if(elapsed >= time_per_loop):
        last_update = now
        return True

    return False



#-- strobe animation handler --#
strobe_FPS = 1

strobe_update_frame = FPS / strobe_FPS

def handle_strobe():
    global current_strip_state
    global strip
    global current_frame
    global color

    
    copy_of_strip = generate_blank_strip()
    for i in range(len(strip)):
        #toggles all the strip to on
        copy_of_strip[i] = color if current_strip_state[i] == (0,0,0) else (0,0,0)
    current_strip_state = copy_of_strip



#-- slow pulse animation handler --#

#slow pulse updates every frame

rising = True
current_pulse_color = (0,0,0)

def handle_slow_pulse():
    global current_strip_state
    global strip
    global current_frame
    global color
    global rising
    global current_pulse_color

    copy_of_strip = generate_blank_strip()

    r_moving = color[0] / FPS
    g_moving = color[2] / FPS
    b_moving = color[1] / FPS
    
    
    
    r = int(current_pulse_color[0] - (r_moving))
    g = int(current_pulse_color[2] - (g_moving))
    b = int(current_pulse_color[1] - (b_moving))
    
    if rising:
        r = int(current_pulse_color[0] + (r_moving))
        g = int(current_pulse_color[2] + (g_moving))
        b = int(current_pulse_color[1] + (b_moving))
    r = max((min((round(r), 255)), 0)) 
    b = max((min((round(b), 255)), 0)) 
    g = max((min((round(g), 255)), 0)) 
    for i in range(len(strip)):
        copy_of_strip[i] = (r, b, g)
        
    current_pulse_color = (r, b, g)
    if current_frame == 29:
        rising = not rising
    current_strip_state = copy_of_strip

#-- wig wag animation handler --#

wig_wag_FPS = 2

wig_wag_update_frame = FPS / wig_wag_FPS

wig_wag_toggle = 0

def handle_wig_wag():
    global current_strip_state
    global strip
    global current_frame
    global wig_wag_toggle
    global color

    copy_of_strip = generate_blank_strip()
    for i in range(len(strip)):
        #toggles the half of the strip to on and half off
        if i % 2 == 0:
            copy_of_strip[i] = color if wig_wag_toggle == 0 else (0,0,0)
        else:
            copy_of_strip[i] = color if wig_wag_toggle == 1 else (0,0,0)
    wig_wag_toggle = 0 if wig_wag_toggle == 1 else 1
    current_strip_state = copy_of_strip


#---tron animation handler ---#
number_of_trons = 10

tron_positions = []

tron_FPS = 10

tron_tails_size = 4

tron_update_frame = round(FPS / tron_FPS)

def init_tron():
    global number_of_trons
    global tron_positions
    global strip
    
    for i in range(number_of_trons):
        start_index = 0
        if i > 0:
            start_index = round(len(strip) * (1/number_of_trons) * i) 
        tron_positions.append(start_index)

def percolate_tron_tails(copy_of_strip):
    global tron_positions
    global tron_tails_size
    global color

    r = color[0]
    b = color[1]
    g = color[2]

    percentage_decrease = 1 / tron_tails_size

    for i in range(len(tron_positions)):
        for j in range(tron_tails_size):
            index = tron_positions[i] - j
            if j == 0:
                copy_of_strip[index] = (r, b, g)
                continue
            if(index < 0):
                continue
            new_r = round(r - (r * (percentage_decrease) * j))
            new_g = round(g - (g * (percentage_decrease)* j))
            new_b = round(b - (b * (percentage_decrease)* j))
            copy_of_strip[index] = (new_r, new_b, new_g)
    return copy_of_strip
    #placeholder to add the tails of the trons


def handle_increment_tron():
    global current_strip_state
    global tron_positions
    global color

    copy_of_strip = generate_blank_strip()

    #print(color)
    #print(tron_positions)

    for i in range(len(tron_positions)):
        copy_of_strip[tron_positions[i]] = color
        tron_positions[i] += 1
        if(tron_positions[i] >= len(copy_of_strip)):
            tron_positions[i] = 0
    #print(current_strip_state)
    strip_with_tails = percolate_tron_tails(copy_of_strip)
    #print(strip_with_tails)
    current_strip_state = strip_with_tails

#---no animation-----#
def handle_set_static_color(color):
    global status
    global current_strip_state
    
    copy_of_strip = generate_blank_strip()

    for i in range(len(copy_of_strip)):
        copy_of_strip[i] = color

    current_strip_state = copy_of_strip
 

#---global strip updates-----#
def handle_update_animation_state():
    global status
    global selected_animation
    global animation
    global last_frame_animation
    global current_frame
    global color

    
    if(animation == 'tron'):

        if(current_frame % tron_update_frame == 0):
            handle_increment_tron()
        return
    if(animation == 'slow_pulse'):
        handle_slow_pulse()

        return
    if(animation == 'strobe'):
        if(current_frame % strobe_update_frame == 0):
            handle_strobe()
        return
    if(animation == 'wig_wag'):
        if(current_frame % wig_wag_update_frame == 0):
            handle_wig_wag()
      
        return
    if(current_frame == (FPS - 1)):
        handle_set_static_color(color)

        
def write_strip():
    global strip
    global current_strip_state

    for i in range(len(strip)):
        strip[i] = current_strip_state[i]
    strip.write()
    

strip.fill((0,0,0))

#------------------updates portion------------#

def fetch_status():
    global position
    #print('here2')
    try: 
        response = urequests.get(f'https://thingamabob.bayviewphysicians.com/light-status?position={position}')
        #print(response)
        obj = response.json()
    except Exception as e:
        print(f'Error fetching status: {e}')
        return 'error'
    updated_anim = obj['animation']
    updated_status = obj['status']
    #print('here')
    updated_color = tuple(int(x) for x in obj.get("color", "0,0,0").split(','))

    #print(updated_anim, updated_status, updated_color)
    return [updated_status, updated_anim, updated_color]

    

#actually updates the current status and animation (and later the color received)
def update_status(new_obj):
    global status
    global prev_status
    global selected_animation
    global last_frame_animation
    global color
    global trouble_color
    global recovery_color
    global selected_color
    global trouble_animation_cycle_count
    global recovery_animation_cycle_count
    global animation
    global FPS

    frame_status = new_obj[0]
    new_animation = new_obj[1]
    new_color = new_obj[2]
    #did status just change?
    if(frame_status != status):
        if(frame_status == 'trouble'):
            color = trouble_color
            animation = 'wig_wag'
            trouble_animation_cycle_count = (10 * FPS)
        if(frame_status == 'normal'):
            color = recovery_color
            animation = 'slow_pulse'
            recovery_animation_cycle_count = (10 * FPS)
        
    
    #status has not just changed
    if(frame_status == status):
        if(frame_status == 'trouble'):
            trouble_animation_cycle_count -= 1
            if(trouble_animation_cycle_count <= 0):
                #if the trouble animation cycle is over, revert to idle trouble animatio, which is strobe, color does not change
                animation = 'none'
        if(frame_status == 'normal'):
            recovery_animation_cycle_count -= 1
            if(recovery_animation_cycle_count <= 0):
                #if the recovery animation cycle is over, revert to selected_animation and color to the selected_color
                animation = selected_animation
                color = selected_color

    #capture the frame status, which could be new, and update the selected animation and color (to be used after the status cycle is over)
    prev_status = status
    status = frame_status
    last_frame_animation = animation
    selected_animation = new_animation
    selected_color = new_color

    if(status == 'off'):
        animation = 'none'
        color = (0,0,0)


##handles the polling interval and overwrites the status, selected color, and selected animation if needed
countdown=seconds_per_poll*FPS
def handle_status_poll_interval():
        global status
        global selected_animation
        global selected_color
        global countdown
        global seconds_per_poll
        global FPS

        update_obj = [status, selected_animation, selected_color]
        
        if(countdown==0):
            update_obj = fetch_status()
            countdown = seconds_per_poll * FPS
            
        countdown -= 1
        
        update_status(update_obj)

def setup_led_controllers():
    init_current_strip_state()
    init_tron()
def connect():
    ssid = 'MSA IT'
    password = 'vrt45h@MSA2019!'
    
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    while not wlan.isconnected():
        print('waiting for connection')
        time.sleep(1)
    ip = wlan.ifconfig()[0]
    print(f'Connected on {ip}')

##----SETUP ----##

try: 
    connect()
except Exception as e:
    #print('Connection Error')
    machine.reset()

setup_led_controllers()
##----MAIN LOOP ----##

sleep_time = 1/FPS


def main():
    global current_frame
    global sleep_time

    while True:
        
        current_frame += 1
        if(current_frame >= FPS):
            current_frame = 0
        handle_update_animation_state()
        handle_status_poll_interval()
        write_strip()
        time.sleep(sleep_time)
       
main()  




