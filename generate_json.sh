#!/bin/bash
echo "const galleryData = {"

echo "    'coloridas': ["
for i in {1..29}; do
    file="images/cor-$i.jpg"
    if [ -f "$file" ]; then
        w=$(sips -g pixelWidth "$file" | tail -n1 | awk '{print $2}')
        h=$(sips -g pixelHeight "$file" | tail -n1 | awk '{print $2}')
        orient="landscape"
        if [ "$h" -gt "$w" ]; then orient="portrait"; fi
        echo "        { src: '$file', orientation: '$orient', title: '', artist: 'Victor Ribeiro', description: '' },"
    fi
done
echo "    ],"

echo "    'preto-e-branco': ["
for i in {1..50}; do
    file="images/pb-$i.jpg"
    if [ -f "$file" ]; then
        w=$(sips -g pixelWidth "$file" | tail -n1 | awk '{print $2}')
        h=$(sips -g pixelHeight "$file" | tail -n1 | awk '{print $2}')
        orient="landscape"
        if [ "$h" -gt "$w" ]; then orient="portrait"; fi
        echo "        { src: '$file', orientation: '$orient', title: '', artist: 'Victor Ribeiro', description: '' },"
    fi
done
echo "    ]"
echo "};"
