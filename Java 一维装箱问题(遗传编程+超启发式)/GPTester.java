import java.io.*;
import java.util.*;

public class GPTester {

    static final int CAPACITY = 100;
    static final int MEMORY_CAP = 100;
    static final double EPS = 1e-9;

    // ========== 树节点 ==========
    static class Node {
        String value;
        Node left, right;
        boolean isOp;

        Node(String v) { this.value = v; this.isOp = false; }
        Node(String v, Node l, Node r) {
            this.value = v; this.isOp = true; this.left = l; this.right = r;
        }
    }

    // ========== 存储解析后的树 ==========
    static class ParsedTree {
        int index;
        int fitness;
        Node root;
        ParsedTree(int i, int f, Node r) { index = i; fitness = f; root = r; }
    }

    // ========== 非递归树解析 ==========
    static Node parseTree(String expr) {
        expr = expr.trim();

        // 去掉最外层匹配括号
        while (expr.startsWith("(") && expr.endsWith(")")) {
            int depth = 0;
            boolean matched = true;
            for (int i = 0; i < expr.length() - 1; i++) {
                if (expr.charAt(i) == '(') depth++;
                else if (expr.charAt(i) == ')') depth--;
                if (depth == 0 && i < expr.length() - 1) { matched = false; break; }
            }
            if (!matched) break;
            expr = expr.substring(1, expr.length() - 1).trim();
        }

        // 找顶层操作符（最右边的）
        int depth = 0;
        int splitPos = -1;
        String foundOp = null;

        for (int i = 0; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (depth == 0) {
                for (String op : new String[]{"+", "-", "*", "/"}) {
                    if (i + op.length() <= expr.length() &&
                        expr.substring(i, i + op.length()).equals(op)) {
                        boolean valid = true;
                        // 允许前面是空格、'(' 或 ')'
                        if (i > 0) {
                            char prev = expr.charAt(i-1);
                            if (prev != ' ' && prev != '(' && prev != ')') valid = false;
                        }
                        // 后面必须是空格、'(' 或数字/字母
                        if (i + op.length() < expr.length()) {
                            char next = expr.charAt(i + op.length());
                            if (next != ' ' && next != '(' && next != ')' && !Character.isLetterOrDigit(next)) valid = false;
                        }
                        if (valid) {
                            splitPos = i;
                            foundOp = op;
                        }
                    }
                }
            }
        }

        if (foundOp != null && splitPos >= 0) {
            String leftStr = expr.substring(0, splitPos).trim();
            String rightStr = expr.substring(splitPos + foundOp.length()).trim();
            rightStr = rightStr.trim();
            Node left = parseTree(leftStr);
            Node right = parseTree(rightStr);
            return new Node(foundOp, left, right);
        }

        return new Node(expr.trim());
    }

    // ========== 非递归 eval ==========
    static double eval(Node root, double S, double E, double L,
                       double min, double max, double avg,
                       double FE, double FL, double FXE, double FXL, double FI) {
        if (root == null) return 0;

        Deque<Node> order = new ArrayDeque<>();
        Deque<Node> stack = new ArrayDeque<>();
        stack.push(root);

        while (!stack.isEmpty()) {
            Node n = stack.pop();
            order.push(n);
            if (n.left != null) stack.push(n.left);
            if (n.right != null) stack.push(n.right);
        }

        Map<Node, Double> values = new IdentityHashMap<>();

        while (!order.isEmpty()) {
            Node n = order.pop();
            if (!n.isOp) {
                double v;
                String val = n.value.trim();
                switch (val) {
                    case "S": v = S; break;
                    case "E": v = E; break;
                    case "L": v = L; break;
                    case "min": v = min; break;
                    case "max": v = max; break;
                    case "avg": v = avg; break;
                    case "FE": v = FE; break;
                    case "FL": v = FL; break;
                    case "FXE": v = FXE; break;
                    case "FXL": v = FXL; break;
                    case "FI": v = FI; break;
                    default:
                        try { v = Double.parseDouble(val); }
                        catch (Exception e) { v = 0; }
                }
                values.put(n, v);
            } else {
                double l = values.getOrDefault(n.left, 0.0);
                double r = values.getOrDefault(n.right, 0.0);
                double res;
                switch (n.value.trim()) {
                    case "+": res = l + r; break;
                    case "-": res = l - r; break;
                    case "*": res = l * r; break;
                    case "/": res = Math.abs(r) < EPS ? l : l / r; break;
                    default: res = 0;
                }
                values.put(n, res);
            }
        }

        return values.getOrDefault(root, 0.0);
    }

    // ========== 循环缓冲区记忆 ==========
    static class CircularMemory {
        int[] buffer = new int[MEMORY_CAP];
        int size = 0, head = 0;
        double min = 0, max = 0, avg = 0;
        int[] freq = new int[101];

        void add(int value) {
            buffer[head] = value;
            head = (head + 1) % MEMORY_CAP;
            if (size < MEMORY_CAP) size++;
        }

        void updateStats(int newValue) {
            add(newValue);
            if (size == 0) { min = max = avg = 0; return; }
            min = Double.MAX_VALUE; max = 0;
            long sum = 0;
            Arrays.fill(freq, 0);
            if (size < MEMORY_CAP) {
                for (int i = 0; i < size; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
            } else {
                for (int i = head; i < MEMORY_CAP; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
                for (int i = 0; i < head; i++) {
                    int v = buffer[i];
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v; if (v <= 100) freq[v]++;
                }
            }
            avg = sum / (double) size;
        }

        double getFitRatio(int space) {
            if (size == 0 || space <= 0) return 0;
            int cnt = 0, limit = Math.min(space, 100);
            for (int i = 1; i <= limit; i++) cnt += freq[i];
            return (double) cnt / size;
        }

        double getAlmostFitRatio(int space) {
            if (size == 0 || space <= 0) return 0;
            int cnt = 0, lo = Math.max(1, space - 3), hi = Math.min(space, 100);
            for (int i = lo; i <= hi; i++) cnt += freq[i];
            return (double) cnt / size;
        }
    }

    // ========== 物品和箱子 ==========
    static class Item {
        int size, index;
        Item(int s, int i) { size = s; index = i; }
    }

    static class Bin {
        List<Item> items = new ArrayList<>();
        int remaining = CAPACITY;
        boolean canAdd(Item it) { return it.size <= remaining; }
        void add(Item it) { items.add(it); remaining -= it.size; }
        int getRemaining() { return remaining; }
    }

    // ========== GP打包 ==========
    static List<Bin> packWithGP(Node tree, List<Item> allItems) {
        List<Bin> bins = new ArrayList<>();
        CircularMemory mem = new CircularMemory();

        for (Item item : allItems) {
            int S = item.size;
            mem.updateStats(S);

            Bin bestBin = null;
            double bestScore = -1e9;

            for (Bin b : bins) {
                if (!b.canAdd(item)) continue;
                int E = b.getRemaining();
                int L = E - S;

                double score = eval(tree, S, E, L, mem.min, mem.max, mem.avg,
                    mem.getFitRatio(E), mem.getFitRatio(L),
                    mem.getAlmostFitRatio(E), mem.getAlmostFitRatio(L),
                    mem.getFitRatio(E));

                if (score > bestScore) {
                    bestScore = score;
                    bestBin = b;
                }
            }

            if (bestBin != null) bestBin.add(item);
            else { Bin nb = new Bin(); nb.add(item); bins.add(nb); }
        }
        return bins;
    }

    // ========== Best-Fit ==========
    static int bestFit(List<Item> items) {
        List<Bin> bins = new ArrayList<>();
        for (Item it : items) {
            Bin best = null;
            int minRem = Integer.MAX_VALUE;
            for (Bin b : bins) {
                if (b.canAdd(it) && b.getRemaining() < minRem) {
                    minRem = b.getRemaining();
                    best = b;
                }
            }
            if (best != null) best.add(it);
            else { Bin nb = new Bin(); nb.add(it); bins.add(nb); }
        }
        return bins.size();
    }

    // ========== 加载物品 ==========
    static List<Item> loadItems(String file) throws Exception {
        List<Item> items = new ArrayList<>();
        Scanner sc = new Scanner(new File(file));
        int idx = 0;
        while (sc.hasNextInt()) items.add(new Item(sc.nextInt(), idx++));
        sc.close();
        return items;
    }

    // ========== 加载L2 bounds ==========
    static Map<String, Integer> loadL2Bounds(String csvFile) throws Exception {
        Map<String, Integer> map = new HashMap<>();
        BufferedReader br = new BufferedReader(new FileReader(csvFile));
        br.readLine(); // 跳过表头
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split(",");
            String testSet = parts[0].trim();
            String instance = parts[1].trim();
            int l2 = Integer.parseInt(parts[2].trim());
            map.put(testSet + "|" + instance, l2);
        }
        br.close();
        return map;
    }

    // ========== 从 top10_trees.txt 加载所有树 ==========
    static List<ParsedTree> loadAllTrees(String filename) throws Exception {
        List<ParsedTree> trees = new ArrayList<>();
        BufferedReader br = new BufferedReader(new FileReader(filename));
        String line;
        int lineNum = 0;

        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            lineNum++;

            int fitnessStart = line.indexOf("FITNESS=");
            if (fitnessStart == -1) {
                System.out.println("跳过格式错误的行 " + lineNum + ": " + line.substring(0, Math.min(50, line.length())));
                continue;
            }

            int fitnessEnd = line.indexOf(' ', fitnessStart);
            if (fitnessEnd == -1) fitnessEnd = line.length();
            String fitnessStr = line.substring(fitnessStart + 8, fitnessEnd).trim();
            int fitness = Integer.parseInt(fitnessStr);

            String expr = line.substring(fitnessEnd).trim();

            System.out.println("解析 TREE_" + trees.size() + " FITNESS=" + fitness + " 长度=" + expr.length());
            Node root = parseTree(expr);
            trees.add(new ParsedTree(trees.size(), fitness, root));
        }

        br.close();
        System.out.println("共加载 " + trees.size() + " 棵树\n");
        return trees;
    }

    // ========== 主程序 ==========
    public static void main(String[] args) throws Exception {
        String treeFile = args.length > 0 ? args[0] : "top10_trees.txt";
        String l2File = args.length > 1 ? args[1] : "l2_bounds_testdual_0_4_8_instances.csv";

        System.out.println("加载树文件: " + treeFile);
        List<ParsedTree> trees = loadAllTrees(treeFile);

        Map<String, Integer> l2Map = loadL2Bounds(l2File);
        String[] testSets = {"testdual0", "testdual4", "testdual8"};

        System.out.println("预加载测试实例...");
        Map<String, List<Item>> allItems = new HashMap<>();
        for (String set : testSets) {
            for (int i = 0; i <= 19; i++) {
                String instFile = set + "/binpack" + i + ".txt";
                File f = new File(instFile);
                if (f.exists()) {
                    allItems.put(set + "|binpack" + i + ".txt", loadItems(instFile));
                }
            }
        }
        System.out.println("预加载完成: " + allItems.size() + " 个实例\n");

        for (ParsedTree pt : trees) {
            System.out.println("================================================================================");
            System.out.println("TREE_" + pt.index + " (Training FITNESS=" + pt.fitness + ")");
            System.out.println("================================================================================");
            System.out.printf("%-12s %-15s %-8s %-8s %-8s %-8s %-10s\n",
                "TestSet", "Instance", "L2", "GP", "BestFit", "GP-L2", "Status");
            System.out.println("--------------------------------------------------------------------------------");

            int totalGP = 0, totalBF = 0, totalL2 = 0;
            int count = 0;

            for (String set : testSets) {
                for (int i = 0; i <= 19; i++) {
                    String key = set + "|binpack" + i + ".txt";
                    String instName = "binpack" + i + ".txt";

                    if (!allItems.containsKey(key)) {
                        System.out.println("跳过 (文件不存在): " + set + "/" + instName);
                        continue;
                    }

                    List<Item> items = allItems.get(key);
                    int l2 = l2Map.getOrDefault(key, -1);
                    int gpBins = packWithGP(pt.root, items).size();
                    int bfBins = bestFit(items);
                    int gap = gpBins - l2;

                    String status;
                    if (gap <= 100) status = "OK(1.0)";
                    else if (gap <= 120) status = "OK(0.8)";
                    else if (gap <= 160) status = "OK(0.6)";
                    else if (gap <= 180) status = "OK(0.4)";
                    else if (gap <= 200) status = "OK(0.2)";
                    else status = "FAIL(0)";

                    System.out.printf("%-12s %-15s %-8d %-8d %-8d %-8d %-10s\n",
                        set, instName, l2, gpBins, bfBins, gap, status);

                    totalGP += gpBins;
                    totalBF += bfBins;
                    totalL2 += l2;
                    count++;
                }
                System.out.println("--------------------------------------------------------------------------------");
            }

            System.out.println("================================================================================");
            System.out.printf("%-12s %-15s %-8d %-8d %-8d %-8.1f\n",
                "TOTAL/AVG", "", totalL2/count, totalGP/count, totalBF/count,
                (double)(totalGP - totalL2)/count);
            System.out.println("================================================================================");
            System.out.println();
        }

        System.out.println("\n========== 所有树汇总对比 ==========");
        System.out.printf("%-8s %-12s %-12s %-12s\n", "Tree", "Avg GP", "Avg BF", "Avg GP-L2");
        System.out.println("------------------------------------------------");

        for (ParsedTree pt : trees) {
            int totalGP = 0, totalBF = 0, totalL2 = 0, count = 0;
            for (String set : testSets) {
                for (int i = 0; i <= 19; i++) {
                    String key = set + "|binpack" + i + ".txt";
                    if (!allItems.containsKey(key)) continue;
                    List<Item> items = allItems.get(key);
                    int l2 = l2Map.getOrDefault(key, -1);
                    totalGP += packWithGP(pt.root, items).size();
                    totalBF += bestFit(items);
                    totalL2 += l2;
                    count++;
                }
            }
            double avgGP = (double) totalGP / count;
            double avgBF = (double) totalBF / count;
            double avgGap = (double)(totalGP - totalL2) / count;
            System.out.printf("%-8s %-12.1f %-12.1f %-12.1f\n",
                "TREE_" + pt.index, avgGP, avgBF, avgGap);
        }
    }
}