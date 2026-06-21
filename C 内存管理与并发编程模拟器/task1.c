//upated by Nov 17 2025

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>

#define TOTAL_MEMORY_SIZE (1 * 1024 ) // 1 MB
#define SLICE_SIZE 1 // 1 KB
#define BUFFER_SIZE 100 // Maximum number of requests that can be queued
#define MAX_TIME_SLICE 10 // Maximum time slice in units
#define DEALLOCATE_INTERVAL 3 // Interval for deallocation

typedef enum { FIRST_FIT, NEXT_FIT, WORST_FIT } AllocationStrategy;

typedef struct MemoryRequest {
    int id;
    int size; // in KB
    int timeSlice; // Duration of the request in time units
    int allocationTime; // Time when the request was allocated
    struct MemoryRequest *next;
} MemoryRequest;


typedef struct Node {
    bool isHole;
    int startBlockID;
    int slices;
    int requestId; // ID of the request occupying the memory block
    int timeSlice; // Duration of the request in time units
    int allocationTime; // Time when the request was allocated
    struct Node *next;
} Node;

Node *memoryHead = NULL, *lastAllocated = NULL;
MemoryRequest *bufferHead = NULL;
int bufferCount = 0;
int currentTime = 0;
AllocationStrategy strategy = FIRST_FIT; // Default allocation strategy
bool requestNotAllocated = false;//lobal variable to track if any request was not allocated

// Function Declarations
void initializeMemory();
Node* createNode(int startBlockID, int slices, bool isHole, int requestId, int timeSlice, int allocationTime);
MemoryRequest* createRequest(int id, int size, int timeSlice);
void enqueueRequest(MemoryRequest *request);
MemoryRequest* dequeueRequest();
void processRequests();

void allocateMemory(MemoryRequest *request);
void firstFitAllocation(MemoryRequest *request);
void nextFitAllocation(MemoryRequest *request);
void worstFitAllocation(MemoryRequest *request);
void allocateToNode(Node *node, MemoryRequest *request, int requiredSlices);

void deallocateMemory(int requestID);
void compactMemory();
void displayMemoryState();
void displayBufferState();
void setAllocationStrategy(AllocationStrategy strat);
void simulateTimeProgression();

void initializeMemory() {
    memoryHead = createNode(0, TOTAL_MEMORY_SIZE / SLICE_SIZE, true, -1, 0, -1);
}

Node* createNode(int startBlockID, int slices, bool isHole, int requestId, int timeSlice, int allocationTime) {
    Node *node = (Node *)malloc(sizeof(Node));
    node->startBlockID = startBlockID;
    node->slices = slices;
    node->isHole = isHole;
    node->requestId = requestId;
    node->timeSlice = timeSlice;
    node->allocationTime = allocationTime;
    node->next = NULL;
    return node;
}

MemoryRequest* createRequest(int id, int size, int timeSlice) {
    MemoryRequest *request = (MemoryRequest *)malloc(sizeof(MemoryRequest));
    request->id = id;
    request->size = size;
    request->timeSlice = timeSlice;
    request->allocationTime = -1; // Not allocated yet
    request->next = NULL;
    return request;
}

void enqueueRequest(MemoryRequest *request) {
    if (bufferCount >= BUFFER_SIZE) {
        printf("Buffer is full. Dropping request ID %d\n", request->id);
        free(request);
        return;
    }
    if (bufferHead == NULL) {
        bufferHead = request;
    } else {
        MemoryRequest *temp = bufferHead;
        while (temp->next != NULL) {
            temp = temp->next;
        }
        temp->next = request;
    }
    bufferCount++;
}

MemoryRequest* dequeueRequest() {
    if (bufferHead == NULL) {
        return NULL;
    }
    MemoryRequest *request = bufferHead;
    bufferHead = bufferHead->next;
    bufferCount--;
    return request;
}

void allocateMemory(MemoryRequest *request) {
    switch (strategy) {
        case FIRST_FIT:
            firstFitAllocation(request);
            break;
        case NEXT_FIT:
            nextFitAllocation(request);
            break;
        case WORST_FIT:
            worstFitAllocation(request);
            break;
    }
}


void firstFitAllocation(MemoryRequest *request) {
    Node *current = memoryHead;

    while (current != NULL) {
        int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;
        if (current->isHole && current->slices >= requiredSlices) {
            // Allocate to this node
            allocateToNode(current, request, requiredSlices);
            return;
        }
        current = current->next;
    }
}

void nextFitAllocation(MemoryRequest *request) {
    if (!request) return;
    int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;
    if(!memoryHead)return;
    //If the last allocated pointer is null, start from the head of the list
    if (!lastAllocated) lastAllocated = memoryHead;

    Node *start = lastAllocated;         // Record the starting point
    Node *curr  = start;  // Start from the next 

    do{
        if (curr->isHole && curr->slices >= requiredSlices) {
            allocateToNode(curr, request, requiredSlices);
            lastAllocated = curr;     // Update lastAllocated
            return;
        }
        // Move to the next 
        curr = (curr->next!=NULL) ? curr->next : memoryHead;
    }while (curr != start);
}

void worstFitAllocation(MemoryRequest *request) {
    if (!request) return;
    int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;

    Node *curr        = memoryHead;
    Node *worstNode   = NULL;   // largest available empty partition 
    int   worstSlices = 0;      // largest available empty partition size

    while (curr) {
        if (curr->isHole && curr->slices > worstSlices) {
            worstSlices = curr->slices;
            worstNode   = curr;
        }
        curr = curr->next;
    }

    // If even the largest block is insufficient, the allocation will fail.
    if (!worstNode || worstNode->slices < requiredSlices) {
        return;
    }

    // Allocate using the largest block
    allocateToNode(worstNode, request, requiredSlices);

    // Next Fit start from here
    lastAllocated = worstNode;
}


void allocateToNode(Node *node, MemoryRequest *request, int requiredSlices) {
    node->isHole = false;
    node->requestId = request->id;
    node->timeSlice = request->timeSlice;
    node->allocationTime = currentTime;

    int remainingSlices = node->slices - requiredSlices;
    node->slices = requiredSlices;

    // Update request's allocation time to indicate successful allocation
    request->allocationTime = currentTime;

    if (remainingSlices > 0) {
        Node *newNode = createNode(node->startBlockID + requiredSlices, remainingSlices, true, -1, 0, -1);
        newNode->next = node->next;
        node->next = newNode;
    }
}



void deallocateMemory(int requestID) {
    Node *current = memoryHead, *prev = NULL;

    while (current != NULL) {
        if (!current->isHole && current->requestId == requestID) {
            current->isHole = true;
            current->requestId = -1;
            
            if (prev && prev->isHole) {
                prev->slices += current->slices;
                prev->next = current->next;

                if(lastAllocated == current){
                    lastAllocated = prev;
                }

                free(current);
                current = prev->next;
            } else {
                Node *next = current->next;
                if (next && next->isHole) {
                    current->slices += next->slices;
                    current->next = next->next;

                    if(lastAllocated == next){
                        lastAllocated = current;
                    }

                    free(next);
                } else {
                    current = current->next;
                }
            }
        } else {
            prev = current;
            current = current->next;
        }
    }
    compactMemory();
}

void compactMemory() {
    Node *write = memoryHead;   // next position 
    Node *curr  = memoryHead;   // Pointer
    int   newStart = 0;         

    // Move the allocated blocks forward, only changing the starting numbers and not splitting the nodes.
    while (curr) {
        Node *next = curr->next;   

        if (!curr->isHole) {       // Only process allocated blocks
            curr->startBlockID = newStart;
            newStart += curr->slices;
            write = curr;     
        }
        curr = next;
    }

    // Calculate the remaining free space at the end.
    int totalSlices = TOTAL_MEMORY_SIZE / SLICE_SIZE;
    int freeSlices  = totalSlices - newStart;

    // Delete all the idle nodes, and then generate a large tail idle block at once.
    Node *prev = NULL;
    curr = memoryHead;
    while (curr) {
        if (curr->isHole && lastAllocated == curr) {
            lastAllocated = prev;   
        }

        if (curr->isHole) {
            if (lastAllocated == curr) lastAllocated = NULL;
            if (prev) prev->next = curr->next;
            else memoryHead = curr->next;

            if (lastAllocated == curr) lastAllocated = prev;

            Node *toFree = curr;
            curr = curr->next;
            free(toFree);
        } else {
            prev = curr;
            curr = curr->next;
        }
    }
 
    if (!lastAllocated || lastAllocated->isHole)
        lastAllocated = memoryHead; 
    
    // Insert a unique large idle node at the end of the linked list
    Node *newHole = createNode(newStart, freeSlices, true, -1, 0, -1);
    Node *tail = memoryHead;
    if (tail) {
        while (tail->next) tail = tail->next;   // Find the current tail of the linked list.
        tail->next = newHole;                   // Append the large free block at the end.
    } else {
        memoryHead = newHole;                   // Extreme case: completely empty
    }
}

void displayMemoryState() {
    printf("Memory State at time %d:\n", currentTime);
    Node *current = memoryHead;
    while (current != NULL) {
        printf("Request ID: %d, Block ID: %d, Slices: %d, %s, Time Slice: %d, Allocation Time: %d\n", current->requestId,
               current->startBlockID, current->slices,
               current->isHole ? "Free" : "Allocated",
               current->timeSlice, current->allocationTime);
        current = current->next;
    }
}

void displayBufferState() {
    printf("Buffer State: %d requests in buffer\n", bufferCount);
    MemoryRequest *current = bufferHead;
    while (current != NULL) {
        printf("Request ID: %d, Size: %d KB, Time Slice: %d, Allocation Time: %d\n",
               current->id, current->size, current->timeSlice, current->allocationTime);
        current = current->next;
    }
}

void setAllocationStrategy(AllocationStrategy strat) {
    strategy = strat;
    printf("Allocation Strategy set to %s\n", (strat == FIRST_FIT) ? "First Fit" : (strat == NEXT_FIT) ? "Next Fit" : "Worst Fit");
}

void processRequests() {
    MemoryRequest **requestRef = &bufferHead;  // Pointer to the pointer to the current request
    
    while (*requestRef != NULL) {
        MemoryRequest *currentRequest = *requestRef;
        allocateMemory(currentRequest);

        // If request was allocated, remove it from the buffer
        if (currentRequest->allocationTime != -1) {
            *requestRef = currentRequest->next;  // Skip the allocated request
            free(currentRequest);  // Free the allocated request
            bufferCount--;  // Decrement buffer count
        } else {
            // Move to the next request if the current one couldn't be allocated
            requestRef = &(currentRequest->next);
        }
    }
}

void simulateTimeProgression() {
    printf("\n--- Current Time: %d ---\n", currentTime);
    displayBufferState();
    processRequests();
    displayMemoryState();

    while (true) {
       
        processRequests();
        
        currentTime++;

        // Perform deallocation and compaction
        if (currentTime % DEALLOCATE_INTERVAL == 0) {
            Node *current = memoryHead;
            while (current != NULL) {
                if (!current->isHole && currentTime - current->allocationTime >= current->timeSlice) {
                    deallocateMemory(current->requestId);
                    current = memoryHead;   // restart traversal after deallocation
                }
                current = current->next;
            }
            compactMemory();
            printf("\n--- After Compaction at Time: %d ---\n", currentTime);
            displayMemoryState();
            displayBufferState(); // Display buffer state after compaction

            processRequests(); // Retry allocation for all requests in the buffer
        }

        // Stop the simulation if no pending requests and no allocations
        if (bufferHead == NULL) {
            bool hasAllocations = false;
            Node *current = memoryHead;
            while (current != NULL) {
                if (!current->isHole) {
                    hasAllocations = true;
                    break;
                }
                current = current->next;
            }
            if (!hasAllocations) {
                printf("No pending requests and no allocations. Stopping simulation.\n");
                break;
            }
        }
    }
}


int main() {
    srand(time(NULL)); // Seed for random number generation
    initializeMemory();
    setAllocationStrategy(NEXT_FIT); // Set the desired strategy here

    // Enqueue requests with random time slices
    for (int i = 0; i < 100; i++) {
        int timeSlice = rand() % MAX_TIME_SLICE + 1; // Random time slice between 1 and MAX_TIME_SLICE
        enqueueRequest(createRequest(i, (rand() % (50 - 2 + 1)) + 2, timeSlice));
    }
    simulateTimeProgression();
    return 0;
}