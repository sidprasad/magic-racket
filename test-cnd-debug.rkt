#lang racket

(displayln "Starting CnD test...")
(displayln "Regular output line 1")
(displayln "Regular output line 2")

; Simple CnD output
(displayln "[CND] {\"atoms\": [{\"id\": \"A\", \"label\": \"Node A\", \"type\": \"Entity\"}, {\"id\": \"B\", \"label\": \"Node B\", \"type\": \"Entity\"}], \"relations\": [{\"src\": \"A\", \"dst\": \"B\", \"label\": \"connects\"}]}")

(displayln "More regular output...")

; More complex CnD output
(displayln "[CND] {\"atoms\": [{\"id\": \"X\", \"label\": \"Node X\", \"type\": \"Process\"}, {\"id\": \"Y\", \"label\": \"Node Y\", \"type\": \"Process\"}, {\"id\": \"Z\", \"label\": \"Node Z\", \"type\": \"Data\"}], \"relations\": [{\"src\": \"X\", \"dst\": \"Y\", \"label\": \"calls\"}, {\"src\": \"Y\", \"dst\": \"Z\", \"label\": \"produces\"}, {\"src\": \"Z\", \"dst\": \"X\", \"label\": \"feeds_back\"}]}")

(displayln "Test completed.")
