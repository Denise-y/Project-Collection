#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>
#include <stdbool.h>
#include <time.h>


#define TOTAL_MEMORY_SIZE (1*1024*1024)  
#define SLICE_SIZE 1024           
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
AllocationStrategy strategy = FIRST_FIT;
bool requestNotAllocated = false;   


unsigned long g_totalProd = 0, g_totalCons = 0;
unsigned long g_succAlloc = 0, g_failAlloc = 0;

// Mutexes and semaphores
pthread_mutex_t bufMux = PTHREAD_MUTEX_INITIALIZER;  // Buffer Mutex for protecting buffer[]
pthread_mutex_t memMux = PTHREAD_MUTEX_INITIALIZER;  // Memory Mutex for protecting memoryHead
pthread_mutex_t timeMux = PTHREAD_MUTEX_INITIALIZER; // Time Mutex for controlling time progression
pthread_mutex_t statMux = PTHREAD_MUTEX_INITIALIZER; // Mutex for statistics
pthread_mutex_t ioMux   = PTHREAD_MUTEX_INITIALIZER;   

//The classic producer-consumer triad
sem_t empty, full, syn;

// Function declarations
void initializeMemory();
Node* createNode(int startBlockID, int slices, bool isHole, int requestId, int timeSlice, int allocationTime);
MemoryRequest* createRequest(int id, int size, int timeSlice);
void enqueueRequest(MemoryRequest *request);
MemoryRequest* dequeueRequest();
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
void *producer(void *arg);
void *consumer(void *arg);
void *timeKeeper(void *arg);

#define LOG(fmt, ...) do { pthread_mutex_lock(&ioMux); printf(fmt, ##__VA_ARGS__); pthread_mutex_unlock(&ioMux); } while (0)

// Initialize memory with one large hole
void initializeMemory() {
    memoryHead = createNode(0, TOTAL_MEMORY_SIZE / SLICE_SIZE, true, -1, 0, -1);
    lastAllocated = memoryHead;
}

// Create a new memory block (node)
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

// Create a memory request
MemoryRequest* createRequest(int id, int size, int timeSlice) {
    MemoryRequest *req = (MemoryRequest *)malloc(sizeof(MemoryRequest));
    req->id = id;
    req->size = size; 
    req->timeSlice = timeSlice;
    req->allocationTime = -1; // Not allocated yet
    req->next = NULL;
    return req;
}
// Enqueue a request into the buffer
void enqueueRequest(MemoryRequest *request) {
    pthread_mutex_lock(&bufMux);  // Lock buffer while enqueueing
    if (bufferCount >= BUFFER_SIZE) {
        pthread_mutex_lock(&statMux);
        g_failAlloc++; 
        pthread_mutex_unlock(&statMux);
        pthread_mutex_unlock(&bufMux); 
        free(request); 
        return;
    }
    request->next = NULL;
    if (!bufferHead) {
        bufferHead = request;
    }else {
        MemoryRequest *temp = bufferHead;
        while (temp->next) {
            temp = temp->next;
        }
        temp->next = request;
    }
    bufferCount++;
    pthread_mutex_unlock(&bufMux);  // Unlock buffer after enqueueing
}

MemoryRequest* dequeueRequest() {
    pthread_mutex_lock(&bufMux);  // Lock buffer while dequeuing
    if (!bufferHead) { 
        pthread_mutex_unlock(&bufMux); // Unlock before returning
        return NULL; 
    }
    MemoryRequest *request = bufferHead;
    bufferHead = bufferHead->next;
    bufferCount--;
    pthread_mutex_unlock(&bufMux);  // Unlock buffer after dequeuing
    return request;
}

// Allocate memory based on the allocation strategy
void allocateMemory(MemoryRequest *request) {
    switch (strategy) {
        case FIRST_FIT:  firstFitAllocation(request);  break;
        case NEXT_FIT:   nextFitAllocation(request);   break;
        case WORST_FIT:  worstFitAllocation(request);  break;
    }
    if (request->allocationTime == -1) {
        pthread_mutex_lock(&statMux); 
        g_failAlloc++; 
        pthread_mutex_unlock(&statMux);
    } else {
        pthread_mutex_lock(&statMux); 
        g_succAlloc++; 
        pthread_mutex_unlock(&statMux);
    }
}


void firstFitAllocation(MemoryRequest *request) {
    int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;
    pthread_mutex_lock(&memMux);
    for (Node *current = memoryHead; current; current = current->next) {
        if (current->isHole && current->slices >= requiredSlices) { 
            allocateToNode(current, request, requiredSlices); 
            pthread_mutex_unlock(&memMux); 
            return; 
        }
    }
    pthread_mutex_unlock(&memMux);
}

void nextFitAllocation(MemoryRequest *request) {
    if (!request) return;
    int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;
    if(!memoryHead)return;
    pthread_mutex_lock(&memMux);
    if (!lastAllocated) lastAllocated = memoryHead;

    Node *start = lastAllocated;
    Node *curr = start;

    do {
        if (curr->isHole && curr->slices >= requiredSlices) { 
            allocateToNode(curr, request, requiredSlices); 
            lastAllocated = curr; 
            pthread_mutex_unlock(&memMux); 
            return; 
        }
        curr = (curr->next ? curr->next : memoryHead);
    } while (curr != start);
    pthread_mutex_unlock(&memMux);
}

void worstFitAllocation(MemoryRequest *request) {
    int requiredSlices = (request->size + SLICE_SIZE - 1) / SLICE_SIZE;
    pthread_mutex_lock(&memMux);
    Node *worstNode = NULL; 
    int worstSlices = 0;
    for (Node *curr = memoryHead; curr; curr = curr->next) {
        if (curr->isHole && curr->slices > worstSlices) { 
            worstSlices = curr->slices; 
            worstNode = curr; 
        }
    }
    if (worstNode && worstNode->slices >= requiredSlices) { 
        allocateToNode(worstNode, request, requiredSlices); 
        lastAllocated = worstNode; 
        pthread_mutex_unlock(&memMux); 
        return; 
    }
    pthread_mutex_unlock(&memMux);
}

// Allocate to a memory node
void allocateToNode(Node *node, MemoryRequest *request, int requiredSlices) {
    node->isHole = false; 
    node->requestId = request->id;
    node->timeSlice = request->timeSlice; 
    node->allocationTime = currentTime;

    int remainingSlices = node->slices - requiredSlices;
    node->slices = requiredSlices;

    request->allocationTime = currentTime;

    if (remainingSlices > 0) {
        Node *newHole = createNode(node->startBlockID + requiredSlices, remainingSlices, true, -1, 0, -1);
        newHole->next = node->next; 
        node->next = newHole;
    }
}

// Deallocate memory block
void deallocateMemory(int requestID) {
    pthread_mutex_lock(&memMux);
    Node *current = memoryHead,*prev = NULL;

    while (current) {
        if (!current->isHole && current->requestId == requestID) {
            current->isHole = true; 
            current->requestId = -1;

            Node *next = current->next;
            if (next && next->isHole) { 
                current->slices += next->slices; 
                current->next = next->next; 
                free(next); 
            }
            if (prev && prev->isHole) { 
                prev->slices += current->slices; 
                prev->next = current->next; 
                free(current); 
                current = prev; 
            }
        }
        prev = current; 
        current = current->next;
    }
    pthread_mutex_unlock(&memMux);
    compactMemory();
}

// Compact memory after deallocation
void compactMemory() {
    pthread_mutex_lock(&memMux);
    int newStart = 0;
    for (Node *c = memoryHead; c; c = c->next) {
        if (!c->isHole) { 
            c->startBlockID = newStart; 
            newStart += c->slices; 
        }
    }
    int freeSlices = TOTAL_MEMORY_SIZE / SLICE_SIZE - newStart;
    Node *prev = NULL, *c = memoryHead;
    while (c) {
        if (c->isHole) {
            if (prev) prev->next = c->next; 
            else memoryHead = c->next;

            Node *t = c; 
            c = c->next; 
            free(t);
        } else { 
            prev = c; 
            c = c->next; 
        }
    }
    Node *newHole = createNode(newStart, freeSlices, true, -1, 0, -1);
    if (!memoryHead) {
        memoryHead = newHole;
    }else { 
        Node *tail = memoryHead; 
        while (tail->next) tail = tail->next; 
        tail->next = newHole; 
    }
    lastAllocated = memoryHead;
    pthread_mutex_unlock(&memMux);
}

// Display memory state
void displayMemoryState() {
    LOG("Memory State at time %d:\n", currentTime);
    Node *current = memoryHead;
    while (current) {
        LOG("Request ID: %d, Block ID: %d, Slices: %d, %s, Time Slice: %d, Allocation Time: %d\n",
            current->requestId, current->startBlockID, current->slices,
            current->isHole ? "Free" : "Allocated", current->timeSlice, current->allocationTime);
        current = current->next;
    }
}

// Display buffer state
void displayBufferState() {
    LOG("Buffer State: %d requests in buffer\n", bufferCount);
    MemoryRequest *current = bufferHead;
    while (current) {
        LOG("Request ID: %d, Size: %d KB, Time Slice: %d, Allocation Time: %d\n",
            current->id, current->size, current->timeSlice, current->allocationTime);
        current = current->next;
    }
}

// Set allocation strategy
void setAllocationStrategy(AllocationStrategy strat) {
    strategy = strat;
    LOG("Allocation Strategy set to %s\n",
        strat == FIRST_FIT ? "First Fit" : strat == NEXT_FIT ? "Next Fit" : "Worst Fit");
}

// Producer thread function (create requests and add to the buffer)
void* producer(void *arg) {
    long tid = (long)arg;
    for (int i = 0; i < 50; i++) {
        int size = rand() % (50 - 2 + 1) + 2;
        int ts   = rand() % MAX_TIME_SLICE + 1;
        MemoryRequest *r = createRequest(tid * 50 + i, size, ts);

        sem_wait(&empty);
        sem_wait(&syn);
        enqueueRequest(r);
        pthread_mutex_lock(&statMux); 
        g_totalProd++; 
        pthread_mutex_unlock(&statMux);
        LOG("[T-%ld] PROD  req=%d  size=%d KB\n", tid, r->id, size);

        sem_post(&syn);
        sem_post(&full);
        usleep(10 * 1000);   /* 10 ms */
    }
    return NULL;
}

// Consumer thread function (consume and process requests)
void* consumer(void *arg) {
    long tid = (long)arg;
    while (1) {
        sem_wait(&full);
        sem_wait(&syn);
        MemoryRequest *r = dequeueRequest();
        sem_post(&syn);
        sem_post(&empty);
        if (r) {
            LOG("[T-%ld] CONS  req=%d  size=%d KB\n", tid, r->id, r->size);
            allocateMemory(r);
            free(r);
            pthread_mutex_lock(&statMux); 
            g_totalCons++; 
            pthread_mutex_unlock(&statMux);
        }
        usleep(1 * 1000);
    }
    return NULL;
}

// TimeKeeper thread function (simulate time progression and handle deallocation)
void* timeKeeper(void *arg) {
    while (1) {
        usleep(200000);
        pthread_mutex_lock(&timeMux);
        currentTime++;
        pthread_mutex_unlock(&timeMux);
        if (currentTime % DEALLOCATE_INTERVAL == 0) {
            Node *c = memoryHead;
            while (c) {
                if (!c->isHole && currentTime - c->allocationTime >= c->timeSlice)
                    deallocateMemory(c->requestId);
                c = c->next;
            }
            compactMemory();
            pthread_mutex_lock(&statMux);
            unsigned long prod, cons, succ, fail;
            prod = g_totalProd; cons = g_totalCons; succ = g_succAlloc; fail = g_failAlloc;
            pthread_mutex_unlock(&statMux);
            LOG("=== TIME %d  STAT  prod=%lu cons=%lu succ=%lu fail=%lu\n",
                currentTime, prod, cons, succ, fail);
        }
    }
    return NULL;
}

// Main function
int main() {
    srand(time(NULL)); // Seed for random number generation
    initializeMemory();
    setAllocationStrategy(NEXT_FIT); // Set the desired strategy here

    sem_init(&empty, 0, BUFFER_SIZE);
    sem_init(&full,  0, 0);
    sem_init(&syn,   0, 1);

    // Create threads
    pthread_t prod[3], cons[3], tk;
    for (long i = 0; i < 3; i++) pthread_create(&prod[i], NULL, producer, (void*)i);
    for (long i = 0; i < 3; i++) pthread_create(&cons[i], NULL, consumer, (void*)i);
    pthread_create(&tk, NULL, timeKeeper, NULL);

    // Wait for threads to finish
    for (int i = 0; i < 3; i++) pthread_join(prod[i], NULL);
    sleep(5);
    LOG("=== All threads finished. Final STAT  fail=%lu  ===\n", g_failAlloc);
    pthread_cancel(tk);
    for (int i = 0; i < 3; i++) pthread_cancel(cons[i]);

    // Destroy semaphores
    sem_destroy(&empty); 
    sem_destroy(&full); 
    sem_destroy(&syn);

    return 0;
}