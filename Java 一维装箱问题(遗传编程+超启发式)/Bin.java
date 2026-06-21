import java.util.*;
// 箱子：管理容量、剩余空间、放物品
public class Bin {
    static int CAPACITY = 100;
    List<Item> items = new ArrayList<>();
    int remaining = CAPACITY;

    // 空构造
    public Bin() {}

    // 直接给物品新建箱子
    public Bin(Item item) {
        items.add(item);
        remaining = CAPACITY - item.size;
    }

    // 能不能放这个物品
    public boolean canAdd(Item item) {
        return item.size <= remaining;
    }

    // 放进去
    public void add(Item item) {
        items.add(item);
        remaining -= item.size;
    }

    // 获取剩余空间
    public int getRemaining() {
        return remaining;
    }

    // 获取里面的物品
    public List<Item> getItems() {
        return items;
    }
}