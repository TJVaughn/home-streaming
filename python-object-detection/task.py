import cv2, os, sys
import numpy as np
import time
import datetime
debug = True 
def debug_log(message):
    if debug:
        print(message)

def write_on_frame(frame, detection, confidence, classifier):
    center_x = int(detection[0] * frame.shape[1])
    center_y = int(detection[1] * frame.shape[0])
    width = int(detection[2] * frame.shape[1])
    height = int(detection[3] * frame.shape[0])

    x = int(center_x - width / 2)
    y = int(center_y - height / 2)

    # Draw  box and label on the frame
    cv2.rectangle(frame, (x, y), (x + width, y + height), (0, 255, 0), 2)
    # label = f"{classes[class_id]}: {confidence:.2f}"
    label = f"{classifier}: {confidence:.2f}"
    cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

# while True:
def task():
    start_time = time.time()
# Load YOLO file/
    classes = []

# Load class names from coco file
    with open("coco.names", "r") as f:
        classes = f.read().strip().split("\n")

    # video_path = sys.argv[1][:-4]
    video_path = "live-video-stream-50" 

    # cap = cv2.VideoCapture(f"{video_path}.mp4")
    cap = cv2.VideoCapture(f"tcp://192.168.0.50:5000")
    if (cap.isOpened() == False):  
        print("Error reading video stream") 
  
# We need to set resolutions. 
# so, convert them from float to integer. 
    # frame_width = int(cap.get(3)) 
    # frame_height = int(cap.get(4)) 
       
    net = cv2.dnn.readNet("yolov3.weights", "yolov3.cfg")
    # size = (frame_width, frame_height) 
    # now = datetime.datetime.now()
    # raw_stream_output_dir = f"../outputs/{now.year}-{now.month}-{now.day}"
    # raw_stream_output = f"{raw_stream_output_dir}/{now.hour}:{now.minute}:{now.second}.mp4"
    # if not os.path.exists(raw_stream_output_dir):
    #     os.makedirs(raw_stream_output_dir)
    # raw_stream = cv2.VideoWriter(raw_stream_output, cv2.VideoWriter_fourcc(*'mp4v'), 10, size)
                         
    # result = cv2.VideoWriter(f"{video_path}-obj-det.mp4",  
    #                      cv2.VideoWriter_fourcc(*'mp4v'), 
    #                      10, size)
# Initialize variables for frame extraction
    frame_rate = 25   
    frame_count = 0
#!/usr/bin/env python
    # signal.signal(signal.SIGINT, signal_handler)
    # frames = []
    clips = []
    first_frame = None 
    last_frame = None 
    f_classifier = [] 
    while True:
        try:
            ret, frame = cap.read()
            if not ret:
                break
            # raw_stream.write(frame)
            # if len(frames) < 100_000:
            #     frames.append(frame)

            frame_count+=1
            # Extract frames at the specified interval
            if frame_count % frame_rate == 0:
                
                # Run YOLO on the frame
                # Convert the frame to a blob that YOLO can process
                # - frame: the input image frame
                # - 0.00392: scale factor (1/255)
                # - (416, 416): target size of the input blob
                # - (0, 0, 0): mean subtraction values for each channel (BGR)
                # - True: swap Red and Blue channels (OpenCV uses BGR)
                # - crop=False: don't crop the image, resize it

                blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
                net.setInput(blob)  # Set the input blob for the neural network
                outs = net.forward(net.getUnconnectedOutLayersNames()) # Forward pass the input blob through the network to get detections
                
                # Process YOLO output
                best_frame = {}
                for out in outs:
                    for detection in out:
                        scores = detection[5:]
                        class_id = np.argmax(scores)
                        confidence = scores[class_id]
                        if confidence > 0.5:  # Filter detections by confidence threshold
                            if len(best_frame) == 0 or best_frame.get(classes[class_id]) is None:
                                best_frame[classes[class_id]] = {"frame": frame, "conf": confidence, "class_id": class_id, "detection":detection}
                                # frame = write_on_frame(frame, detection, confidence, classes[class_id])
                            if confidence > best_frame[classes[class_id]].get("conf"):
                                best_frame[classes[class_id]] = {"frame": frame, "conf": confidence, "class_id": class_id, "detection":detection}
                                # frame = write_on_frame(frame, detection, confidence, classes[class_id])
                                continue
                

                # best_frame = check_frame(frame)

                if len(best_frame) != 0:
                       
                    for classifier, best in best_frame.items():
                        detection = best["detection"]
                        class_id = best["class_id"]
                        confidence = best["conf"]
                        # raw_frame = best["frame"]
                        # print(f"writing on frame: {frame_count}. len best frame items: {len(best_frame.items())} ")
                        write_on_frame(frame, detection, confidence, classifier)



                        # center_x = int(detection[0] * frame.shape[1])
                        # center_y = int(detection[1] * frame.shape[0])
                        # width = int(detection[2] * frame.shape[1])
                        # height = int(detection[3] * frame.shape[0])
                        #
                        # x = int(center_x - width / 2)
                        # y = int(center_y - height / 2)
                        #
                        # # Draw  box and label on the frame
                        # cv2.rectangle(frame, (x, y), (x + width, y + height), (0, 255, 0), 2)
                        # label = f"{classes[class_id]}: {confidence:.2f}"
                        # cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                        output_dir = f"./frames/{classifier}"
                        if not os.path.exists(output_dir):
                            os.makedirs(output_dir)

                        # output_path = f"./frames/{classifier}/{video_path}-img_fr{frame_count}_conf{confidence:.2f}.png"
                        # debug_log(output_path)
                        # if len(frames) < 6:
                        #     continue
                        time_stamp = frame_count / 25
                        debug_log(f"time stamp: {time_stamp} seconds")
                        # result.write(frames[frame_count - 6])
                        # result.write(write_on_frame(frames[frame_count-3], detection, confidence, classes[class_id])) 
                        print(classifier)

                        if classifier not in f_classifier:
                            f_classifier.append(classifier)

                        if first_frame is None:
                            first_frame = frame_count
                            # f_classifier.append(classifier)
                        if last_frame is None or frame_count > last_frame:
                            last_frame = frame_count
                        # frame_rate = 3
                    # result.write(frame) 
                        # cv2.imwrite(output_path, frame)
                else: 
                    if first_frame and last_frame and f_classifier:
                        clips.append((first_frame/25 - 2, last_frame/25 + 2, f_classifier))
                        first_frame = None
                        last_frame = None
                        classifier = None
                    # frame_rate = 12
            # for f in detected_frames:
            #     debug_log(f"Frame detected: {f}")
            #     cv2.imshow(" DISPLAYING : FRAME |  Detections", f)
            #     cv2.waitKey(0)  #continue.

                # Display the frame with detections
            if time.time() - start_time > 3600:
                break
        except KeyboardInterrupt:
            # result.release()
            # raw_stream.release()
            cap.release()
            cv2.destroyAllWindows()
            # debug_log(len(frames))
            # debug_log(sys.getsizeof(frames))
            debug_log(f"Exec time: {time.time()-start_time}")
            debug_log('You pressed Ctrl+C! in the exception')
            sys.exit(0)
            
    for clip in clips:
        first, last, classifier = clip

        
        ffmpegCmd = f"ffmpeg -ss {first} -i {video_path}.mp4 -to {last} -c copy {video_path}_{'-'.join(classifier)}_{first}_{last}.mp4 -y"
        print(ffmpegCmd)
    cap.release()
    cv2.destroyAllWindows()
    # result.release()
    # raw_stream.release()
    # debug_log(len(frames))
    # debug_log(sys.getsizeof(frames))
    debug_log(f"Exec time: {time.time()-start_time}")
    # sys.exit(0)
            
def signal_handler(sig, frame):
    # ult.release()
    # cap.release()
    # debug_log(len(frames))
    # debug_log(sys.getsizeof(frames))
    # debug_log(f"Exec time: {time.time()-start_time}")
    cv2.destroyAllWindows()
    debug_log('You pressed Ctrl+C! in the signal handler')
    sys.exit(0)

# task()
