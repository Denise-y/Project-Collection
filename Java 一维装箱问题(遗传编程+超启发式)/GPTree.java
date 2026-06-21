import java.util.*;

public class GPTree {
    private static final Random rand = new Random(42);
    private static final double EPS = 1e-9;
    private final List<String> leaves;
    private final List<String> ops;

    public GPTree() {
        this(Arrays.asList("S", "E", "L", "min", "max", "avg", "FE", "FL", "FXE", "FXL", "FI"),
             Arrays.asList("+", "-", "*", "/"));
    }

    public GPTree(List<String> leaves, List<String> ops) {
        this.leaves = new ArrayList<>(leaves);
        this.ops = new ArrayList<>(ops);
    }

    public static class Node {
        public String value;
        public Node left, right;
        public boolean isOp;

        public Node() {}

        public Node(String value) {
            this.value = value;
            this.isOp = false;
        }

        public Node(String value, Node left, Node right) {
            this.value = value;
            this.isOp = true;
            this.left = left;
            this.right = right;
        }

        public Node copy() {
            Node n = new Node();
            n.value = this.value;
            n.isOp = this.isOp;
            if (this.left != null) n.left = this.left.copy();
            if (this.right != null) n.right = this.right.copy();
            return n;
        }
    }

    // ========== 从字符串解析树 ==========
    public Node parseTree(String expr) {
        return parseTreeRecursive(expr.trim());
    }

    private Node parseTreeRecursive(String expr) {
        expr = expr.trim();
        if (expr.isEmpty()) return null;

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

        // 找顶层操作符，允许 ) 后面直接跟操作符
        int depth = 0;
        int splitPos = -1;
        String foundOp = null;

        for (int i = 0; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (depth == 0) {
                for (String op : ops) {
                    if (i + op.length() <= expr.length() &&
                        expr.substring(i, i + op.length()).equals(op)) {
                        boolean valid = true;
                        // 允许前面是空格、'(' 或 ')'
                        if (i > 0) {
                            char prev = expr.charAt(i - 1);
                            if (prev != ' ' && prev != '(' && prev != ')') valid = false;
                        }
                        // 后面必须是空格、'(' 或数字/字母（叶子节点开头）
                        if (i + op.length() < expr.length()) {
                            char next = expr.charAt(i + op.length());
                            if (next != ' ' && next != '(' && next != ')' && 
                                !Character.isLetterOrDigit(next)) valid = false;
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
            Node left = parseTreeRecursive(leftStr);
            Node right = parseTreeRecursive(rightStr);
            return new Node(foundOp, left, right);
        }

        // 叶子节点
        return new Node(expr.trim());
    }

    public Node createTree() {
        int depth = rand.nextInt(5) + 2;
        return rand.nextDouble() < 0.5 ? fullTree(depth) : growTree(depth);
    }

    private Node fullTree(int depth) {
        if (depth <= 1) return new Node(leaves.get(rand.nextInt(leaves.size())));
        String func = ops.get(rand.nextInt(ops.size()));
        return new Node(func, fullTree(depth - 1), fullTree(depth - 1));
    }

    private Node growTree(int depth) {
        if (depth <= 1 || rand.nextDouble() < 0.4)
            return new Node(leaves.get(rand.nextInt(leaves.size())));
        String func = ops.get(rand.nextInt(ops.size()));
        return new Node(func, growTree(depth - 1), growTree(depth - 1));
    }

    public double eval(Node n, double S, double E, double L,
                       double min, double max, double avg,
                       double FE, double FL, double FXE, double FXL, double FI) {
        if (n == null) return 0;
        if (!n.isOp) {
            switch (n.value) {
                case "S": return S;
                case "E": return E;
                case "L": return L;
                case "min": return min;
                case "max": return max;
                case "avg": return avg;
                case "FE": return FE;
                case "FL": return FL;
                case "FXE": return FXE;
                case "FXL": return FXL;
                case "FI": return FI;
                default: return 0;
            }
        }
        double l = eval(n.left, S, E, L, min, max, avg, FE, FL, FXE, FXL, FI);
        double r = eval(n.right, S, E, L, min, max, avg, FE, FL, FXE, FXL, FI);
        switch (n.value) {
            case "+": return l + r;
            case "-": return l - r;
            case "*": return l * r;
            case "/": return Math.abs(r) < EPS ? l : l / r;
            default: return 0;
        }
    }

    public Node crossover(Node a, Node b) {
        if (a == null || b == null)
            return (a != null) ? a.copy() : (b != null ? b.copy() : null);
        if (rand.nextDouble() < 0.1)
            return rand.nextBoolean() ? a.copy() : b.copy();

        Node child = a.copy();
        List<Node> aNodes = collectNodes(child);
        List<Node> bNodes = collectNodes(b);
        if (!aNodes.isEmpty() && !bNodes.isEmpty()) {
            Node target = aNodes.get(rand.nextInt(aNodes.size()));
            Node source = bNodes.get(rand.nextInt(bNodes.size())).copy();
            target.value = source.value;
            target.isOp = source.isOp;
            target.left = source.left;
            target.right = source.right;
        }
        return child;
    }

    public Node mutate(Node n) {
        if (n == null) return null;
        if (rand.nextDouble() < 0.1) {
            Node copy = n.copy();
            List<Node> nodes = collectNodes(copy);
            if (!nodes.isEmpty()) {
                Node target = nodes.get(rand.nextInt(nodes.size()));
                if (target.isOp) {
                    target.value = ops.get(rand.nextInt(ops.size()));
                } else {
                    target.value = leaves.get(rand.nextInt(leaves.size()));
                }
            }
            return copy;
        }
        return n.copy();
    }

    public List<Node> collectNodes(Node n) {
        List<Node> nodes = new ArrayList<>();
        if (n == null) return nodes;
        Deque<Node> stack = new ArrayDeque<>();
        stack.push(n);
        while (!stack.isEmpty()) {
            Node curr = stack.pop();
            nodes.add(curr);
            if (curr.left != null) stack.push(curr.left);
            if (curr.right != null) stack.push(curr.right);
        }
        return nodes;
    }

    public static void printTree(Node node) {
        if (node == null) return;
        if (node.isOp) System.out.print("(");
        printTree(node.left);
        System.out.print(node.value + " ");
        printTree(node.right);
        if (node.isOp) System.out.print(")");
    }

    public static void buildTreeStr(Node n, StringBuilder sb) {
        if (n == null) return;
        if (n.isOp) sb.append("(");
        buildTreeStr(n.left, sb);
        sb.append(n.value).append(" ");
        buildTreeStr(n.right, sb);
        if (n.isOp) sb.append(")");
    }

    // ========== 局部搜索辅助方法 ==========
    public String getRandomLeaf() {
        return leaves.get(rand.nextInt(leaves.size()));
    }

    public String getRandomOp() {
        return ops.get(rand.nextInt(ops.size()));
    }

    public Node createSmallTree(int maxDepth) {
        if (maxDepth <= 1) return new Node(leaves.get(rand.nextInt(leaves.size())));
        if (rand.nextDouble() < 0.7) return new Node(leaves.get(rand.nextInt(leaves.size())));
        String func = ops.get(rand.nextInt(ops.size()));
        return new Node(func, createSmallTree(maxDepth - 1), createSmallTree(maxDepth - 1));
    }
}